/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter } from 'vscode';
import { UserCancelledError } from 'vscode-azureextensionui';
import { CancellationPromiseSource } from '../utils/promiseUtils';

export interface ContextManager {
    readonly onContextChanged: Event<void>;
    readonly contextChangedCancellationPromise: Promise<never>;
}

export const contextManager: ContextManager = {
    onContextChanged: new EventEmitter<void>().event,
    contextChangedCancellationPromise: new CancellationPromiseSource(UserCancelledError).promise,
};
