/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as os from 'os';
import * as path from 'path';
import { Memento } from "vscode";
import { localize } from '../../localize';
import { ProcessProvider } from '../coreclr/ChildProcessProvider';
import { FileSystemProvider } from '../coreclr/fsProvider';
import { OutputManager } from "../coreclr/outputManager";

export class DebugpyClient {
    private static readonly stateKey: string = 'DebugpyClient';

    public constructor(
        private readonly dockerOutputManager: OutputManager,
        private readonly globalState: Memento,
        private readonly processProvider: ProcessProvider,
        private readonly fileSystemProvider: FileSystemProvider) { }

    public async AcquireDebugger(): Promise<string> {
        const debuggerPath: string = path.join(os.homedir(), '.debugpy');
        const exists = await this.fileSystemProvider.dirExists(debuggerPath);
        const isUpToDate = await this.isUpToDate(this.lastDebuggerAcquisitionKey());

        if (exists && isUpToDate) {
            // The debugger is up to date...
            return debuggerPath;
        }

        return await this.dockerOutputManager.performOperation(
            localize('vscode-docker.debug.coreclr.debugger.acquiring', 'Acquiring the latest Python debugger...'),
            async () => {
                const acquisitionCommand = `pip install debugpy --upgrade --force-reinstall --target ${debuggerPath}`;

                this.dockerOutputManager.appendLine(localize('vscode-docker.debug.python.debugger.command', '> Executing: {0} <', acquisitionCommand));
                await this.processProvider.exec(acquisitionCommand, {
                    progress: (content) => {
                        this.dockerOutputManager.append(content);
                    }
                });

                await this.updateDate(this.lastDebuggerAcquisitionKey(), new Date());

                return debuggerPath;
            },
            localize('vscode-docker.debug.coreclr.debugger.acquired', 'Debugger acquired.'),
            localize('vscode-docker.debug.coreclr.debugger.unableToAcquire', 'Unable to acquire the Python debugger.'));
    }

    private async isUpToDate(key: string): Promise<boolean> {
        const lastAcquisitionDate = await this.getDate(key);

        if (lastAcquisitionDate) {
            let aquisitionExpirationDate = new Date(lastAcquisitionDate);

            aquisitionExpirationDate.setDate(lastAcquisitionDate.getDate() + 1);

            if (aquisitionExpirationDate.valueOf() > new Date().valueOf()) {
                // The acquisition is up to date...
                return true;
            }
        }

        return false;
    }

    private lastDebuggerAcquisitionKey(): string {
        return `${DebugpyClient.stateKey}.lastDebuggerAcquisition`;
    }

    private async getDate(key: string): Promise<Date | undefined> {
        const dateString = this.globalState.get<string>(key);

        return await Promise.resolve(dateString ? new Date(dateString) : undefined);
    }

    private async updateDate(key: string, timestamp: Date): Promise<void> {
        await this.globalState.update(key, timestamp);
    }
}
