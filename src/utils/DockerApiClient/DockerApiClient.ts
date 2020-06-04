/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DockerInfo, DockerVersion, PruneResult } from './Common';
import { DockerContainer } from './Containers';
import { DockerImage } from './Images';
import { DockerNetwork } from './Networks';
import { DockerVolume } from './Volumes';

export interface DockerApiClient {
    info(): Promise<DockerInfo>;
    version(): Promise<DockerVersion>;

    getContainers(): Promise<DockerContainer[]>;
    getContainer(ref: string): Promise<DockerContainer>;
    getContainerLogs(ref: string): Promise<DockerContainer>;
    pruneContainers(): Promise<PruneResult | undefined>;
    startContainer(ref: string): Promise<void>;
    restartContainer(ref: string): Promise<void>;
    stopContainer(ref: string): Promise<void>;
    deleteContainer(ref: string): Promise<void>;

    getImages(): Promise<DockerImage[]>;
    getImage(ref: string): Promise<DockerImage>;
    pruneImages(): Promise<PruneResult | undefined>;
    tagImage(ref: string, tag: string): Promise<void>;
    deleteImage(ref: string): Promise<void>;

    getNetworks(): Promise<DockerNetwork[]>;
    getNetwork(ref: string): Promise<DockerNetwork>;
    pruneNetworks(): Promise<PruneResult | undefined>;
    createNetwork(info: DockerNetwork): Promise<void>;
    deleteNetwork(ref: string): Promise<void>;

    getVolumes(): Promise<DockerVolume[]>;
    getVolume(ref: string): Promise<DockerVolume>;
    pruneVolumes(): Promise<PruneResult | undefined>;
    createVolume(info: DockerVolume): Promise<void>;
    deleteVolume(ref: string): Promise<void>;
}
