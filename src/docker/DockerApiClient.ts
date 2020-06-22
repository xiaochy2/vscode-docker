/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { CancellationToken } from 'vscode-languageclient';
import { DockerInfo, PruneResult } from './Common';
import { DockerContainer, DockerContainerInspection } from './Containers';
import { DockerContext } from './Contexts';
import { DockerImage, DockerImageInspection } from './Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from './Networks';
import { DockerVolume, DockerVolumeInspection } from './Volumes';

export interface DockerApiClient {
    info(context: IActionContext, token?: CancellationToken): Promise<DockerInfo>;

    getContainers(context: IActionContext, token?: CancellationToken): Promise<DockerContainer[]>;
    inspectContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainerInspection>;
    getContainerLogs(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainer>;
    pruneContainers(context: IActionContext, token?: CancellationToken): Promise<PruneResult | undefined>;
    startContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;
    restartContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;
    stopContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;
    removeContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;

    getImages(context: IActionContext, token?: CancellationToken): Promise<DockerImage[]>;
    inspectImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerImageInspection>;
    pruneImages(context: IActionContext, token?: CancellationToken): Promise<PruneResult | undefined>;
    tagImage(context: IActionContext, ref: string, tag: string, token?: CancellationToken): Promise<void>;
    removeImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;

    getNetworks(context: IActionContext, token?: CancellationToken): Promise<DockerNetwork[]>;
    inspectNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerNetworkInspection>;
    pruneNetworks(context: IActionContext, token?: CancellationToken): Promise<PruneResult | undefined>;
    createNetwork(context: IActionContext, options: { name: string, driver: DriverType }, token?: CancellationToken): Promise<{ id: string }>;
    removeNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;

    getVolumes(context: IActionContext, token?: CancellationToken): Promise<DockerVolume[]>;
    inspectVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerVolumeInspection>;
    pruneVolumes(context: IActionContext, token?: CancellationToken): Promise<PruneResult | undefined>;
    createVolume(context: IActionContext, info: DockerVolume, token?: CancellationToken): Promise<void>;
    removeVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<void>;

    getContexts(context: IActionContext, token?: CancellationToken): Promise<DockerContext[]>;
}
