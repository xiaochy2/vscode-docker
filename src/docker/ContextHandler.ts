/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { UserCancelledError } from "vscode-azureextensionui";
import { CancellationPromiseSource } from "../utils/promiseUtils";

// TODO: fire this on context change
// eslint-disable-next-line @typescript-eslint/tslint/config
export const contextChangedCps = new CancellationPromiseSource(UserCancelledError);
