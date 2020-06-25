/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, Disposable } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { DockerInfo, PruneResult } from '../Common';
import { DockerContainer, DockerContainerInspection } from '../Containers';
import { DockerApiClient } from '../DockerApiClient';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from '../Networks';
import { NotSupportedError } from '../NotSupportedError';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';

export class DockerServeClient implements DockerApiClient, Disposable {
    public dispose(): void {
    }

    public async info(context: IActionContext, token?: CancellationToken): Promise<DockerInfo> {
        throw new NotSupportedError();
    }

    public async getContainers(context: IActionContext, token?: CancellationToken): Promise<DockerContainer[]> {
        throw new NotSupportedError();
    }

    public async inspectContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainerInspection> {
        throw new NotSupportedError();
    }

    public async getContainerLogs(context: IActionContext, ref: string, token?: CancellationToken): Promise<NodeJS.ReadableStream> {
        throw new NotSupportedError();
    }

    public async pruneContainers(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError();
    }

    public async startContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async restartContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async stopContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async getImages(context: IActionContext, token?: CancellationToken): Promise<DockerImage[]> {
        throw new NotSupportedError();
    }

    public async inspectImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerImageInspection> {
        throw new NotSupportedError();
    }

    public async pruneImages(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError();
    }

    public async tagImage(context: IActionContext, ref: string, tag: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async getNetworks(context: IActionContext, token?: CancellationToken): Promise<DockerNetwork[]> {
        throw new NotSupportedError();
    }

    public async inspectNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerNetworkInspection> {
        throw new NotSupportedError();
    }

    public async pruneNetworks(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError();
    }

    public async createNetwork(context: IActionContext, options: { Name: string; Driver: DriverType; }, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async removeNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }

    public async getVolumes(context: IActionContext, token?: CancellationToken): Promise<DockerVolume[]> {
        throw new NotSupportedError();
    }

    public async inspectVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerVolumeInspection> {
        throw new NotSupportedError();
    }

    public async pruneVolumes(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError();
    }

    public async removeVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError();
    }
}
