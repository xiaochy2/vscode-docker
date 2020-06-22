/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import { ContainerState, ContainerStatus, DockerContainer, DockerContainerInspection } from '../Containers';
import { DockerImage, DockerImageInspection } from '../Images';
import { DockerNetwork, DockerNetworkInspection, DriverType } from '../Networks';
import { DockerVolume, DockerVolumeInspection } from '../Volumes';

export class DockerodeContainer implements DockerContainer {
    public constructor(private readonly containerInfo: Dockerode.ContainerInfo) {

    }

    state: ContainerState;
    status: ContainerStatus;
    networks: string[];
    ports: number[];
    image: DockerImage;
    composeProjectName: string;
    id: string;
    name: string;
    createdTime: number;
    treeId: string;
}

export class DockerodeContainerInspection extends DockerodeContainer implements DockerContainerInspection {

}

export class DockerodeImage implements DockerImage {
    repository: string;
    config?: { exposedPorts?: { [portAndProtocol: string]: unknown; }; };
    id: string;
    name: string;
    createdTime: number;
    treeId: string;
}

export class DockerodeImageInspection extends DockerodeImage implements DockerImageInspection {

}

export class DockerodeNetwork implements DockerNetwork {
    driver: DriverType;
    id: string;
    name: string;
    createdTime: number;
    treeId: string;
}

export class DockerodeNetworkInspection extends DockerodeNetwork implements DockerNetworkInspection {

}

export class DockerodeVolume implements DockerVolume {
    type: string;
    id: string;
    name: string;
    createdTime: number;
    treeId: string;

}

export class DockerodeVolumeInspection extends DockerodeVolume implements DockerVolumeInspection {

}
