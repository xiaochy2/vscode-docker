/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DockerObject } from './Common';

export interface DockerContext extends DockerObject {
    readonly description?: string;
    readonly dockerEndpoint?: string;
    readonly current: boolean;
}
