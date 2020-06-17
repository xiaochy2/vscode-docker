/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from 'vscode-languageclient';
import { DockerInfo, PruneResult } from './Common';
import { DockerContainer, DockerContainerInspection } from './Containers';
import { DockerImage, DockerImageInspection } from './Images';
import { DockerNetwork, DockerNetworkInspection } from './Networks';
import { DockerVolume, DockerVolumeInspection } from './Volumes';

export interface DockerApiClient {
    info(token: CancellationToken): Promise<DockerInfo>;

    getContainers(token: CancellationToken): Promise<DockerContainer[]>;
    inspectContainer(ref: string, token: CancellationToken): Promise<DockerContainerInspection>;
    getContainerLogs(ref: string, token: CancellationToken): Promise<DockerContainer>;
    pruneContainers(token: CancellationToken): Promise<PruneResult | undefined>;
    startContainer(ref: string, token: CancellationToken): Promise<void>;
    restartContainer(ref: string, token: CancellationToken): Promise<void>;
    stopContainer(ref: string, token: CancellationToken): Promise<void>;
    removeContainer(ref: string, token: CancellationToken): Promise<void>;

    getImages(token: CancellationToken): Promise<DockerImage[]>;
    inspectImage(ref: string, token: CancellationToken): Promise<DockerImageInspection>;
    pruneImages(token: CancellationToken): Promise<PruneResult | undefined>;
    tagImage(ref: string, tag: string, token: CancellationToken): Promise<void>;
    removeImage(ref: string, token: CancellationToken): Promise<void>;

    getNetworks(token: CancellationToken): Promise<DockerNetwork[]>;
    inspectNetwork(ref: string, token: CancellationToken): Promise<DockerNetworkInspection>;
    pruneNetworks(token: CancellationToken): Promise<PruneResult | undefined>;
    createNetwork(info: DockerNetwork, token: CancellationToken): Promise<void>;
    removeNetwork(ref: string, token: CancellationToken): Promise<void>;

    getVolumes(token: CancellationToken): Promise<DockerVolume[]>;
    inspectVolume(ref: string, token: CancellationToken): Promise<DockerVolumeInspection>;
    pruneVolumes(token: CancellationToken): Promise<PruneResult | undefined>;
    createVolume(info: DockerVolume, token: CancellationToken): Promise<void>;
    removeVolume(ref: string, token: CancellationToken): Promise<void>;
}
