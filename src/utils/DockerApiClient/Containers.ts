/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DockerObject } from './Common';

export type ContainerStatus = 'stopped' | 'running' | 'paused' | 'starting';

export interface DockerContainer extends DockerObject {
    readonly status: ContainerStatus;
}

export type DockerContainerInspection = DockerContainer
