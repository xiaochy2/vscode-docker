/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import * as os from 'os';
import { IActionContext } from 'vscode-azureextensionui';
import { CancellationToken } from 'vscode-languageclient';
import { DockerInfo, PruneResult } from '../Common';
import { DockerContainer, DockerContainerInspection } from '../Containers';
import { DockerContext } from '../Contexts';
import { DockerApiClient } from '../DockerApiClient';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection } from '../Networks';
import { NotSupportedError } from '../NotSupportedError';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';
import { DockerodeContainer, DockerodeNetwork } from './DockerodeObjects';
import { getFullTagFromDigest } from './DockerodeUtils';

export class DockerodeApiClient implements DockerApiClient {
    public constructor(private readonly dockerodeClient: Dockerode) {
    }

    public async info(context: IActionContext, token?: CancellationToken): Promise<DockerInfo> {
        if (os.platform() === 'win32') {
            const result = await this.callWithErrorHandling<{ OSType: 'linux' | 'windows' }>(context, async () => this.dockerodeClient.info(), token);

            return {
                OSType: result?.OSType,
            };
        }

        return {
            OSType: 'linux',
        };
    }

    public async getContainers(context: IActionContext, token?: CancellationToken): Promise<DockerContainer[]> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.listContainers({ all: true }), token);

        return result.map(ci => new DockerodeContainer(ci));
    }

    public async inspectContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainerInspection> {
        const container = this.dockerodeClient.getContainer(ref);
        const result = await this.callWithErrorHandling(context, async () => container.inspect(), token);

        return new DockerodeContainerInspection(result);
    }

    public async getContainerLogs(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainer> {
        throw new NotSupportedError();
    }

    public async pruneContainers(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneContainers(), token);
        return {
            objectsRemoved: result.ContainersDeleted.length,
            spaceFreed: result.SpaceReclaimed,
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
                result.push({
                    id: image.Id,
                    name: getFullTagFromDigest(image),
                    repository: 'todo',
                    createdTime: image.Created,
                });
            } else {
                for (let fullTag of image.RepoTags) {
                    result.push({
                        id: image.Id,
                        name: fullTag,
                        repository: 'todo',
                        createdTime: image.Created,
                    });
                }
            }
        }

        return result;

    }

    public async inspectImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerImageInspection> {
        const image = this.dockerodeClient.getImage(ref);
        const result = await this.callWithErrorHandling(context, async () => image.inspect(), token);

        return new DockerodeImageInspection(result);
    }

    public async pruneImages(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneImages(), token);
        return {
            objectsRemoved: result.ImagesDeleted.length,
            spaceFreed: result.SpaceReclaimed,
        };
    }

    public async tagImage(context: IActionContext, ref: string, fullTag: string, token?: CancellationToken): Promise<void> {
        const repo = fullTag.substr(0, fullTag.lastIndexOf(':'));
        const tag = fullTag.substr(fullTag.lastIndexOf(':'));
        const image = this.dockerodeClient.getImage(ref);
        await this.callWithErrorHandling(context, async () => image.tag({ repo: repo, tag: tag }), token);
    }

    public async removeImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        let image: Dockerode.Image;

        // Dangling images are not shown in the explorer. However, an image can end up with <none> tag, if a new version of that particular tag is pulled.
        if (this.fullTag.endsWith(':<none>') && this._item.repoDigests && this._item.repoDigests.length > 0) {
            // Image is tagged <none>. Need to delete by digest.
            image = await callDockerode(() => ext.dockerode.getImage(this._item.repoDigests[0]));
        } else {
            // Image is normal. Delete by name.
            image = await callDockerode(() => ext.dockerode.getImage(this.fullTag));
        }

        await callDockerodeWithErrorHandling(async () => image.remove({ force: true }), context);
        const image = this.dockerodeClient.getImage(ref);
        return this.callWithErrorHandling(async () => image.remove({ force: true }), token);
    }

    public async getNetworks(context: IActionContext, token?: CancellationToken): Promise<DockerNetwork[]> {
        const result: Dockerode.NetworkInspectInfo[] = await this.callWithErrorHandling(context, async () => this.dockerodeClient.listNetworks(), token);

        return result.map(ni => new DockerodeNetwork(ni));
    }

    public async inspectNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerNetworkInspection> {
        const network = this.dockerodeClient.getNetwork(ref);
        const result = await this.callWithErrorHandling(context, async () => network.inspect(), token);

        return new DockerodeNetworkInspection(result);
    }

    public async pruneNetworks(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneNetworks(), token);
        return {
            objectsRemoved: result.NetworksDeleted.length,
            spaceFreed: 0,
        };
    }

    public async createNetwork(context: IActionContext, info: DockerNetwork, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const network = this.dockerodeClient.getNetwork(ref);
        return this.callWithErrorHandling(context, async () => network.remove({ force: true }), token);
    }

    public async getVolumes(context: IActionContext, token?: CancellationToken): Promise<DockerVolume[]> {
        throw new NotSupportedError();
    }

    public async inspectVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerVolumeInspection> {
        throw new NotSupportedError();
    }

    public async pruneVolumes(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(context, async () => this.dockerodeClient.pruneVolumes(), token);
        return {
            objectsRemoved: result.VolumesDeleted.length,
            spaceFreed: result.SpaceReclaimed,
        };
    }

    public async createVolume(context: IActionContext, info: DockerVolume, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const volume = this.dockerodeClient.getVolume(ref);
        return this.callWithErrorHandling(context, async () => volume.remove({ force: true }), token);
    }

    public async getContexts(context: IActionContext, token?: CancellationToken): Promise<DockerContext[]> {
        throw new NotSupportedError();
    }

    private async callWithErrorHandling<T>(context: IActionContext, callback: () => Promise<T>, token?: CancellationToken): Promise<T> {
        throw new NotSupportedError();
    }
}
