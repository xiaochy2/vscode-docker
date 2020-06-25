/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { Event, EventEmitter } from 'vscode';
import { Disposable } from 'vscode';
import { callWithTelemetryAndErrorHandling, IActionContext } from 'vscode-azureextensionui';
import LineSplitter from '../debugging/coreclr/lineSplitter';
import { ext } from '../extensionVariables';
import { AsyncLazy } from '../utils/lazy';
import { execAsync } from '../utils/spawnAsync';
import { DockerContext, DockerContextInspection } from './Contexts';
import { DockerodeApiClient } from './DockerodeApiClient/DockerodeApiClient';
import { DockerServeClient } from './DockerServeClient/DockerServeClient';

const dockerConfigFile = path.join(os.homedir(), '.docker', 'config.json');
const dockerContextsFolder = path.join(os.homedir(), '.docker', 'contexts', 'meta');

const defaultContext: Partial<DockerContext> = {
    Name: 'default',
    Description: 'Current DOCKER_HOST based configuration',
};

export interface ContextManager {
    readonly onContextChanged: Event<DockerContext>;
    refresh(): Promise<void>;
    getContexts(): Promise<DockerContext[]>;
    inspectContext(actionContext: IActionContext, name: string): Promise<DockerContextInspection>;
}

export class DockerContextManager2 implements ContextManager, Disposable {
    private readonly emitter: EventEmitter<DockerContext> = new EventEmitter<DockerContext>();
    private readonly contextsCache: AsyncLazy<DockerContext[]>;

    public constructor() {
        // eslint-disable-next-line @typescript-eslint/tslint/config
        fs.watchFile(dockerConfigFile, async () => this.refresh());

        this.contextsCache = new AsyncLazy(async () => this.loadContexts());
    }

    public dispose(): void {
        // eslint-disable-next-line @typescript-eslint/tslint/config
        fs.unwatchFile(dockerConfigFile, async () => this.refresh());
    }

    public get onContextChanged(): Event<DockerContext> {
        return this.emitter.event;
    }

    public async refresh(): Promise<void> {
        this.contextsCache.clear();
        const contexts = await this.contextsCache.getValue();
        const currentContext = contexts.find(c => c.Current);

        if (currentContext.DockerEndpoint === 'aci') {
            if (ext.dockerClient instanceof DockerodeApiClient) {
                // Need to switch modes to the new SDK client
                ext.dockerClient.dispose();
                ext.dockerClient = new DockerServeClient();
            }
        } else {
            if (ext.dockerClient instanceof DockerServeClient) {
                // Need to switch modes to the Dockerode client
                ext.dockerClient.dispose();
                ext.dockerClient = new DockerodeApiClient(this);
            }
        }

        this.emitter.fire(currentContext);
    }

    public async getContexts(): Promise<DockerContext[]> {
        return this.contextsCache.getValue();
    }

    public async inspectContext(actionContext: IActionContext, name: string): Promise<DockerContextInspection> {
        const { stdout } = await execAsync(`docker context inspect ${name}`, { timeout: 10000 });

        // The result is an array with one entry
        const result: DockerContextInspection[] = JSON.parse(stdout) as DockerContextInspection[];
        return result[0];
    }

    private async loadContexts(): Promise<DockerContext[]> {
        // TODO: handle settings, env var, telemetry
        return callWithTelemetryAndErrorHandling(ext.dockerClient ? 'docker-context.change' : 'docker-context.initialize', async (actionContext: IActionContext) => {

            if (!(await fse.pathExists(dockerContextsFolder)) || (await fse.readdir(dockerContextsFolder)).length === 0) {
                // If there's nothing inside ~/.docker/contexts/meta, then there's only the default, unmodifiable DOCKER_HOST-based context
                // It is unnecessary to call `docker context inspect`
                return [{
                    ...defaultContext,
                    Current: true,
                    DockerEndpoint: 'TODO',
                } as DockerContext]
            }

            const result: DockerContext[] = [];
            const { stdout } = await execAsync('docker context ls --format="{{json .}}"', { timeout: 10000 });
            const lines = LineSplitter.splitLines(stdout);

            for (const line of lines) {
                result.push(JSON.parse(line) as DockerContext);
            }

            return result;
        });
    }
}

export const contextManager = new DockerContextManager2();
