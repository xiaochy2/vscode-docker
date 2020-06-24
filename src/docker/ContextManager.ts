/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter } from 'vscode';

export interface ContextManager {
    readonly onContextChanged: Event<void>;
    refresh(): Promise<void>;
}

class DockerContextManager implements ContextManager {
    private readonly emitter: EventEmitter<void> = new EventEmitter<void>();

    public get onContextChanged(): Event<void> {
        return this.emitter.event;
    }

    public async refresh(): Promise<void> {
        this.emitter.fire();
    }
}

export const contextManager = new DockerContextManager();
