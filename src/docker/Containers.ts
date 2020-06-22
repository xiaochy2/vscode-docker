/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../localize';
import { DockerObject } from './Common';
import { DockerImage } from './Images';

export type ContainerStatus = 'stopped' | 'running' | 'paused' | 'starting';
export type ContainerState = 'todo' | 'todont';

export interface DockerContainer extends DockerObject {
    readonly status: ContainerStatus;
    readonly state: ContainerState;
    readonly networks: string[];
    readonly ports: number[];
    readonly image: DockerImage;
    readonly composeProjectName: string;
}

export type DockerContainerInspection = DockerContainer

export const NonComposeGroupName = localize('vscode-docker.tree.containers.otherContainers', 'Other Containers');
