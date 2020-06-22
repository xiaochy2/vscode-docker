/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DockerObject } from './Common';

export interface DockerImage extends DockerObject {
    readonly repository: string;
    readonly config?: {
        exposedPorts?: { [portAndProtocol: string]: unknown };
    };
}

export type DockerImageInspection = DockerImage
