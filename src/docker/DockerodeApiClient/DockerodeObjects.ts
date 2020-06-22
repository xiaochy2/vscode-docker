/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import { ContainerState, ContainerStatus, DockerContainer, DockerContainerInspection, NonComposeGroupName } from '../Containers';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from '../Networks';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';

export class DockerodeContainer implements DockerContainer {
    public constructor(private readonly containerInfo: Dockerode.ContainerInfo) {
    }

    public get state(): ContainerState {
        return this.containerInfo.State as ContainerState;
    }

    public get status(): ContainerStatus {
        return this.containerInfo.Status as ContainerStatus;
    }

    public get networks(): string[] {
        return Object.keys(this.containerInfo.NetworkSettings.Networks);
    }

    public get ports(): number[] {
        return this.containerInfo.Ports.map(p => p.PublicPort);
    }

    public get image(): DockerImage {
        return undefined; // TODO
    }

    public get composeProjectName(): string {
        const labels = Object.keys(this.containerInfo.Labels)
            .map(label => ({ label: label, value: this.containerInfo.Labels[label] }));

        const composeProject = labels.find(l => l.label === 'com.docker.compose.project');
        if (composeProject) {
            return composeProject.value;
        } else {
            return NonComposeGroupName;
        }
    }

    public get id(): string {
        return this.containerInfo.Id;
    }

    public get name(): string {
        const names = this.containerInfo.Names.map(name => name.substr(1)); // Remove start '/'

        // Linked containers may have names containing '/'; their one "canonical" names will not.
        const canonicalName = names.find(name => name.indexOf('/') === -1);

        return canonicalName ?? names[0];
    }

    public get createdTime(): number {
        return this.containerInfo.Created * 1000;
    }

    public get treeId(): string {
        return `${this.id}${this.state}`;
    }
}

export class DockerodeContainerInspection extends DockerodeContainer implements DockerContainerInspection {

}

export class DockerodeImage implements DockerImage {
    public readonly name: string;

    public constructor(fullTag: string, private readonly imageInfo: Dockerode.ImageInfo) {
        this.name = fullTag;
    }

    public get repository(): string {
        return 'todo';
    }

    config?: { exposedPorts?: { [portAndProtocol: string]: unknown; }; };

    public get id(): string {
        return this.imageInfo.Id;
    }

    public get createdTime(): number {
        return this.imageInfo.Created * 1000;
    }

    public get treeId(): string {
        return `${this.name}${this.id}`;
    }

    public static getFullTagFromDigest(image: Dockerode.ImageInfo): string {
        let repo = '<none>';
        let tag = '<none>';

        const digest = image.RepoDigests[0];
        if (digest) {
            const index = digest.indexOf('@');
            if (index > 0) {
                repo = digest.substring(0, index);
            }
        }

        return `${repo}:${tag}`;
    }
}

export class DockerodeImageInspection extends DockerodeImage implements DockerImageInspection {

}

export class DockerodeNetwork implements DockerNetwork {
    public constructor(private readonly networkInfo: Dockerode.NetworkInfo) {
    }

    public get driver(): DriverType {
        return 'bridge'; // TODO
    }

    public get id(): string {
        return this.networkInfo.NetworkID;
    }

    public get name(): string {
        return 'todo';
    }

    public get createdTime(): number {
        return this.networkInfo.Created;
    }

    public get treeId(): string {
        return this.id;
    }
}

export class DockerodeNetworkInspection extends DockerodeNetwork implements DockerNetworkInspection {

}

export class DockerodeVolume implements DockerVolume {
    public constructor(private readonly volumeInfo: Dockerode.VolumeInfo) {
    }

    public get type(): string {
        return this.volumeInfo.Type;
    }

    public get id(): string {
        return this.volumeInfo.Id;
    }

    public get name(): string {
        return this.volumeInfo.Name;
    }

    public get createdTime(): number {
        return this.volumeInfo.createdTime;
    }

    public get treeId(): string {
        return this.name;
    }
}

export class DockerodeVolumeInspection extends DockerodeVolume implements DockerVolumeInspection {

}
