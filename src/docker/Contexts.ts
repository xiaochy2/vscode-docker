/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// TODO: better
export interface DockerContext {
    readonly Name: string;
    readonly Description: string;
    readonly DockerEndpoint: string;
    readonly Current: boolean;
}

export interface DockerContextInspection {
    readonly [key: string]: unknown;
}
