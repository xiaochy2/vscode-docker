/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import { IActionContext, parseError, UserCancelledError } from 'vscode-azureextensionui';
import { CancellationToken } from 'vscode-languageclient';
import { localize } from '../../localize';
import { getCancelPromise, TimeoutPromiseSource } from '../../utils/promiseUtils';
import { DockerInfo, PruneResult } from '../Common';
import { ContainerState, DockerContainer, DockerContainerInspection } from '../Containers';
import { contextChangedCps } from '../ContextHandler';
import { DockerContext } from '../Contexts';
import { DockerApiClient } from '../DockerApiClient';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from '../Networks';
import { NotSupportedError } from '../NotSupportedError';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';
import { getComposeProjectName, getContainerName, getFullTagFromDigest } from './DockerodeUtils';

// 20 s timeout for all calls (enough time for a possible Dockerode refresh + the call, but short enough to be UX-reasonable)
const dockerodeCallTimeout = 20 * 1000;

export class DockerodeApiClient implements DockerApiClient {
    private contextChangingPromise: Promise<void> | undefined;

    public constructor(private readonly dockerodeClient: Dockerode) {
    }

    public async info(context: IActionContext, token?: CancellationToken): Promise<DockerInfo> {
        return this.callWithErrorHandling<{ OSType: 'linux' | 'windows' }>(context, async () => this.dockerodeClient.info(), token);
    }

    public async getContainers(context: IActionContext, token?: CancellationToken): Promise<DockerContainer[]> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.listContainers({ all: true }), token);

        return result.map(ci => {
            return {
                ...ci,
                composeProjectName: getComposeProjectName(ci),
                Name: getContainerName(ci),
                CreatedTime: ci.Created * 1000,
                State: ci.State as ContainerState,
                treeId: `${ci.Id}${ci.State}`,
            }
        });
    }

    public async inspectContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainerInspection> {
        const container = this.dockerodeClient.getContainer(ref);
        const result = await this.callWithErrorHandling(context, async () => container.inspect(), token);

        return {
            ...result,
            CreatedTime: new Date(result.Created).valueOf(),
            treeId: undefined, // Not needed on inspect info
        }

    }

    public async getContainerLogs(context: IActionContext, ref: string, token?: CancellationToken): Promise<NodeJS.ReadableStream> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(context, async () => container.logs({ follow: true, stdout: true }));
    }

    public async pruneContainers(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneContainers(), token);
        return {
            ...result,
            ObjectsDeleted: result.ContainersDeleted.length,
        };
    }

    public async startContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(context, async () => container.start(), token);
    }

    public async restartContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(context, async () => container.restart(), token);
    }

    public async stopContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(context, async () => container.stop(), token);
    }

    public async removeContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(context, async () => container.remove({ force: true }), token);
    }

    public async getImages(context: IActionContext, token?: CancellationToken): Promise<DockerImage[]> {
        const images = await this.callWithErrorHandling(context, async () => this.dockerodeClient.listImages({ filters: { dangling: false } }), token);
        const result: DockerImage[] = [];

        for (const image of images) {
            if (!image.RepoTags) {
                const fullTag = getFullTagFromDigest(image);

                result.push({
                    ...image,
                    Name: fullTag,
                    CreatedTime: image.Created * 1000,
                    treeId: `${fullTag}${image.Id}`,
                });
            } else {
                for (const fullTag of image.RepoTags) {
                    result.push({
                        ...image,
                        Name: fullTag,
                        CreatedTime: image.Created * 1000,
                        treeId: `${fullTag}${image.Id}`,
                    });
                }
            }
        }

        return result;
    }

    public async inspectImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerImageInspection> {
        const image = this.dockerodeClient.getImage(ref);
        const result = await this.callWithErrorHandling(context, async () => image.inspect(), token);

        return {
            ...result,
            CreatedTime: new Date(result.Created).valueOf(),
            treeId: undefined, // Not needed on inspect info
            Name: undefined, // Not needed on inspect info
        };
    }

    public async pruneImages(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneImages(), token);
        return {
            ...result,
            ObjectsDeleted: result.ImagesDeleted.length,
        };
    }

    public async tagImage(context: IActionContext, ref: string, fullTag: string, token?: CancellationToken): Promise<void> {
        const repo = fullTag.substr(0, fullTag.lastIndexOf(':'));
        const tag = fullTag.substr(fullTag.lastIndexOf(':'));
        const image = this.dockerodeClient.getImage(ref);
        await this.callWithErrorHandling(context, async () => image.tag({ repo: repo, tag: tag }), token);
    }

    public async removeImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        let image: Dockerode.Image = this.dockerodeClient.getImage(ref);

        // Dangling images are not shown in the explorer. However, an image can end up with <none> tag, if a new version of that particular tag is pulled.
        if (ref.endsWith(':<none>')) {
            // Image is tagged <none>. Need to delete by digest.
            const inspectInfo = await this.callWithErrorHandling(context, async () => image.inspect());
            image = this.dockerodeClient.getImage(inspectInfo.RepoDigests[0]);
        }

        return this.callWithErrorHandling(context, async () => image.remove({ force: true }), token);
    }

    public async getNetworks(context: IActionContext, token?: CancellationToken): Promise<DockerNetwork[]> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.listNetworks(), token);

        return result.map(ni => {
            return {
                ...ni,
                /* eslint-disable @typescript-eslint/tslint/config */
                CreatedTime: new Date(ni.Created).valueOf(),
                treeId: ni.Id,
                /* eslint-enable @typescript-eslint/tslint/config */
            }
        });
    }

    public async inspectNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerNetworkInspection> {
        const network = this.dockerodeClient.getNetwork(ref);
        const result = await this.callWithErrorHandling(context, async () => network.inspect(), token);

        return {
            ...result,
            // eslint-disable-next-line @typescript-eslint/tslint/config
            CreatedTime: new Date(result.Created).valueOf(),
            treeId: undefined, // Not needed on inspect info
            Name: undefined, // Not needed on inspect info
        };
    }

    public async pruneNetworks(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneNetworks(), token);
        return {
            SpaceReclaimed: 0,
            ObjectsDeleted: result.NetworksDeleted.length,
        };
    }

    public async createNetwork(context: IActionContext, options: { Name: string, Driver: DriverType }, token?: CancellationToken): Promise<void> {
        await this.callWithErrorHandling(context, async () => this.dockerodeClient.createNetwork(options), token);
    }

    public async removeNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const network = this.dockerodeClient.getNetwork(ref);
        return this.callWithErrorHandling(context, async () => network.remove({ force: true }), token);
    }

    public async getVolumes(context: IActionContext, token?: CancellationToken): Promise<DockerVolume[]> {
        const result = (await this.callWithErrorHandling(context, async () => this.dockerodeClient.listVolumes(), token)).Volumes;

        return result.map(vi => {
            return {
                ...vi,
                // eslint-disable-next-line @typescript-eslint/tslint/config, @typescript-eslint/no-explicit-any
                CreatedTime: new Date((vi as any).CreatedAt).valueOf(),
                Id: undefined, // Not defined for volumes
                treeId: vi.Name,
            }
        });
    }

    public async inspectVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerVolumeInspection> {
        const volume = this.dockerodeClient.getVolume(ref);
        const result = await this.callWithErrorHandling(context, async () => volume.inspect(), token);

        return {
            ...result,
            // eslint-disable-next-line @typescript-eslint/tslint/config, @typescript-eslint/no-explicit-any
            CreatedTime: new Date((result as any).CreatedAt).valueOf(),
            Id: undefined, // Not defined for volumes
            treeId: undefined, // Not needed on inspect info
        };
    }

    public async pruneVolumes(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneVolumes(), token);
        return {
            ...result,
            ObjectsDeleted: result.VolumesDeleted.length,
        };
    }

    public async removeVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const volume = this.dockerodeClient.getVolume(ref);
        return this.callWithErrorHandling(context, async () => volume.remove({ force: true }), token);
    }

    public async getContexts(context: IActionContext, token?: CancellationToken): Promise<DockerContext[]> {
        throw new NotSupportedError();
    }

    private async callWithErrorHandling<T>(context: IActionContext, callback: () => Promise<T>, token?: CancellationToken): Promise<T> {
        const tps = new TimeoutPromiseSource(dockerodeCallTimeout);
        const evt = tps.onTimeout(() => {
            context.errorHandling.suppressReportIssue = true;
        });

        try {
            if (this.contextChangingPromise) {
                await this.contextChangingPromise;
            }

            const promises: Promise<T>[] = [tps.promise, contextChangedCps.promise, callback()];

            if (token) {
                promises.push(getCancelPromise(token, UserCancelledError));
            }

            try {
                return await Promise.race(promises);
            } catch (err) {
                if (context) {
                    context.errorHandling.suppressReportIssue = true;
                }

                const error = parseError(err);

                if (error?.errorType === 'ENOENT') {
                    throw new Error(localize('vscode-docker.utils.dockerode.failedToConnect', 'Failed to connect. Is Docker installed and running? Error: {0}', error.message));
                }

                throw err;
            }
        } finally {
            evt.dispose();
            tps.dispose();
        }
    }
}
