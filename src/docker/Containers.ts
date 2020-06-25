/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DockerObject } from './Common';

export type ContainerState = 'stopped' | 'running' | 'paused' | 'starting' | 'exited' | 'created';

export interface DockerContainer extends DockerObject {
    readonly State: ContainerState;
    readonly Status: string;
    readonly Image: string;
    readonly ImageID: string;
    readonly NetworkSettings?: {
        readonly Networks?: { readonly [key: string]: unknown };
    };
    readonly Ports?: {
        readonly IP?: string;
        readonly PrivatePort?: number;
        readonly PublicPort?: number;
        readonly Type?: string;
    }[];
    readonly Labels?: {
        readonly [key: string]: string;
    }
}

export interface DockerContainerInspection extends DockerObject {
    readonly HostConfig?: {
        readonly Isolation?: string;
    };
    readonly NetworkSettings?: {
        readonly Ports?: {
            readonly [portAndProtocol: string]: {
                readonly HostIp?: string;
                readonly HostPort?: string;
            }[];
        };
    };
}
