/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import * as os from 'os';
import { CancellationToken } from 'vscode-languageclient';
import { DockerInfo, PruneResult } from '../Common';
import { ContainerStatus, DockerContainer, DockerContainerInspection } from '../Containers';
import { DockerApiClient } from '../DockerApiClient';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection } from '../Networks';
import { NotSupportedError } from '../NotSupportedError';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';

export class DockerodeApiClient implements DockerApiClient {
    public constructor(private readonly dockerodeClient: Dockerode) {
    }

    public async info(token: CancellationToken): Promise<DockerInfo> {
        if (os.platform() === 'win32') {
            const result = await this.callWithErrorHandling<{ OSType: 'linux' | 'windows' }>(async () => this.dockerodeClient.info(), token);

            return {
                OSType: result?.OSType,
            };
        }

        return {
            OSType: 'linux',
        };
    }

    public async getContainers(token: CancellationToken): Promise<DockerContainer[]> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.listContainers({ all: true }), token);

        return result.map(ci => {
            return {
                id: ci.Id,
                name: ci.Names[0],
                status: ci.Status as ContainerStatus,
                createdTime: ci.Created,
            };
        });
    }

    public async inspectContainer(ref: string, token: CancellationToken): Promise<DockerContainerInspection> {
        const container = this.dockerodeClient.getContainer(ref);
        const result = await this.callWithErrorHandling(async () => container.inspect(), token);

        return {
            id: result.Id,
            name: result.Name,
            status: result.State.Status as ContainerStatus,
            createdTime: Number(result.Created),
        };
    }

    public async getContainerLogs(ref: string, token: CancellationToken): Promise<DockerContainer> {
        throw new NotSupportedError();
    }

    public async pruneContainers(token: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.pruneContainers(), token);
        return {
            objectsRemoved: result.ContainersDeleted.length,
            spaceFreed: result.SpaceReclaimed,
        };
    }

    public async startContainer(ref: string, token: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(async () => container.start(), token);
    }

    public async restartContainer(ref: string, token: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(async () => container.restart(), token);
    }

    public async stopContainer(ref: string, token: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(async () => container.stop(), token);
    }

    public async removeContainer(ref: string, token: CancellationToken): Promise<void> {
        const container = this.dockerodeClient.getContainer(ref);
        return this.callWithErrorHandling(async () => container.remove({ force: true }), token);
    }

    public async getImages(token: CancellationToken): Promise<DockerImage[]> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.listImages({ all: true }), token);

        return result.map(ii => {
            return {
                id: ii.Id,
                name: ii.RepoTags[0], // todo
                repository: 'todo',
                createdTime: ii.Created,
            };
        });
    }

    public async inspectImage(ref: string, token: CancellationToken): Promise<DockerImageInspection> {
        const image = this.dockerodeClient.getImage(ref);
        const result = await this.callWithErrorHandling(async () => image.inspect(), token);

        return {
            id: result.Id,
            name: result.RepoTags[0], // todo
            repository: 'todo',
            createdTime: Number(result.Created),
        };
    }

    public async pruneImages(token: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.pruneImages(), token);
        return {
            objectsRemoved: result.ImagesDeleted.length,
            spaceFreed: result.SpaceReclaimed,
        };
    }

    public async tagImage(ref: string, fullTag: string, token: CancellationToken): Promise<void> {
        const repo = fullTag.substr(0, fullTag.lastIndexOf(':'));
        const tag = fullTag.substr(fullTag.lastIndexOf(':'));
        const image = this.dockerodeClient.getImage(ref);
        await this.callWithErrorHandling(async () => image.tag({ repo: repo, tag: tag }), token);
    }

    public async removeImage(ref: string, token: CancellationToken): Promise<void> {
        const image = this.dockerodeClient.getImage(ref);
        return this.callWithErrorHandling(async () => image.remove({ force: true }), token);
    }

    public async getNetworks(token: CancellationToken): Promise<DockerNetwork[]> {
        throw new NotSupportedError();
    }

    public async inspectNetwork(ref: string, token: CancellationToken): Promise<DockerNetworkInspection> {
        throw new NotSupportedError();
    }

    public async pruneNetworks(token: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.pruneNetworks(), token);
        return {
            objectsRemoved: result.NetworksDeleted.length,
            spaceFreed: 0,
        };
    }

    public async createNetwork(info: DockerNetwork, token: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeNetwork(ref: string, token: CancellationToken): Promise<void> {
        const network = this.dockerodeClient.getNetwork(ref);
        return this.callWithErrorHandling(async () => network.remove({ force: true }), token);
    }

    public async getVolumes(token: CancellationToken): Promise<DockerVolume[]> {
        throw new NotSupportedError();
    }

    public async inspectVolume(ref: string, token: CancellationToken): Promise<DockerVolumeInspection> {
        throw new NotSupportedError();
    }

    public async pruneVolumes(token: CancellationToken): Promise<PruneResult> {
        const result = await this.callWithErrorHandling(async () => this.dockerodeClient.pruneVolumes(), token);
        return {
            objectsRemoved: result.VolumesDeleted.length,
            spaceFreed: result.SpaceReclaimed,
        };
    }

    public async createVolume(info: DockerVolume, token: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeVolume(ref: string, token: CancellationToken): Promise<void> {
        const volume = this.dockerodeClient.getVolume(ref);
        return this.callWithErrorHandling(async () => volume.remove({ force: true }), token);
    }

    private async callWithErrorHandling<T>(callback: () => Promise<T>, token: CancellationToken): Promise<T> {
        throw new NotSupportedError();
    }
}
