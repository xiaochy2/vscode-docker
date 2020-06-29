/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Containers as ContainersClient } from "@docker/sdk";
import { DeleteRequest, ListRequest, ListResponse, StopRequest } from "@docker/sdk/dist/containers";
import { CancellationToken } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { DockerInfo, PruneResult } from '../Common';
import { DockerContainer, DockerContainerInspection } from '../Containers';
import { ContextChangeCancelClient } from "../ContextChangeCancelClient";
import { ContextManager } from "../ContextManager";
import { DockerApiClient } from '../DockerApiClient';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from '../Networks';
import { NotSupportedError } from '../NotSupportedError';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';

// 20 s timeout for all calls (enough time for a possible Dockerode refresh + the call, but short enough to be UX-reasonable)
const dockerServeCallTimeout = 20 * 1000;

export class DockerServeClient extends ContextChangeCancelClient implements DockerApiClient {
    private readonly containersClient: ContainersClient;

    public constructor(contextManager: ContextManager) {
        super(contextManager);
        this.containersClient = new ContainersClient();
    }

    public dispose(): void {
        super.dispose();
        void this.containersClient?.close();
    }

    public async info(context: IActionContext, token?: CancellationToken): Promise<DockerInfo> {
        throw new NotSupportedError(context);
    }

    public async getContainers(context: IActionContext, token?: CancellationToken): Promise<DockerContainer[]> {
        const response: ListResponse = await this.promisify(context, this.containersClient, this.containersClient.list, new ListRequest(), token);
        const result = response.getContainersList();

        return result.map(c => {
            const container = c.toObject();
            const ports = container.portsList.map(p => {
                return {
                    IP: p.hostIp,
                    PublicPort: p.hostPort,
                    PrivatePort: p.containerPort,
                    Type: p.protocol,
                };
            });

            const labels: { [key: string]: string } = {};
            container.labelsList.forEach(l => {
                const [label, value] = l.split('=');
                labels[label] = value;
            });

            return {
                Id: container.id,
                Image: container.image,
                Name: container.id, // TODO ?
                State: container.status, // TODO ?
                Status: container.status,
                ImageID: undefined, // TODO ?
                CreatedTime: Date.now().valueOf() - container.cpuTime, // TODO
                Labels: labels, // TODO--not working
                Ports: ports,
            };
        });
    }

    // #region Not supported by the Docker SDK yet
    public async inspectContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerContainerInspection> {
        throw new NotSupportedError(context);
    }

    public async getContainerLogs(context: IActionContext, ref: string, token?: CancellationToken): Promise<NodeJS.ReadableStream> {
        // Supported by SDK, but used only for debugging which will not work in ACI, and complicated to implement
        throw new NotSupportedError(context);
    }

    public async pruneContainers(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError(context);
    }

    public async startContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }

    public async restartContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }
    // #endregion Not supported by the Docker SDK yet

    public async stopContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const request = new StopRequest();
        request.setId(ref);
        request.setTimeout(5000);

        await this.promisify(context, this.containersClient, this.containersClient.stop, request, token);
    }

    public async removeContainer(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        const request = new DeleteRequest();
        request.setId(ref);
        request.setForce(true);

        await this.promisify(context, this.containersClient, this.containersClient.delete, request, token)
    }

    // #region Not supported by the Docker SDK yet
    public async getImages(context: IActionContext, token?: CancellationToken): Promise<DockerImage[]> {
        throw new NotSupportedError(context);
    }

    public async inspectImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerImageInspection> {
        throw new NotSupportedError(context);
    }

    public async pruneImages(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError(context);
    }

    public async tagImage(context: IActionContext, ref: string, tag: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }

    public async removeImage(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }

    public async getNetworks(context: IActionContext, token?: CancellationToken): Promise<DockerNetwork[]> {
        throw new NotSupportedError(context);
    }

    public async inspectNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerNetworkInspection> {
        throw new NotSupportedError(context);
    }

    public async pruneNetworks(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError(context);
    }

    public async createNetwork(context: IActionContext, options: { Name: string; Driver: DriverType; }, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }

    public async removeNetwork(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }

    public async getVolumes(context: IActionContext, token?: CancellationToken): Promise<DockerVolume[]> {
        throw new NotSupportedError(context);
    }

    public async inspectVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<DockerVolumeInspection> {
        throw new NotSupportedError(context);
    }

    public async pruneVolumes(context: IActionContext, token?: CancellationToken): Promise<PruneResult> {
        throw new NotSupportedError(context);
    }

    public async removeVolume(context: IActionContext, ref: string, token?: CancellationToken): Promise<void> {
        throw new NotSupportedError(context);
    }
    // #endregion Not supported by the Docker SDK yet

    private async promisify<TRequest, TResponse>(
        context: IActionContext,
        thisArg: unknown,
        clientCallback: (message: TRequest, callback: (err: unknown, response: TResponse) => void) => unknown,
        message: TRequest,
        token?: CancellationToken): Promise<TResponse> {

        const callPromise: Promise<TResponse> = new Promise((resolve, reject) => {
            try {
                clientCallback.call(thisArg, message, (err, response) => {
                    if (err) {
                        reject(err);
                    }

                    resolve(response);
                });
            } catch (err) {
                reject(err);
            }
        });

        return this.withTimeoutAndCancellations(context, async () => callPromise, dockerServeCallTimeout, token);
    }
}
