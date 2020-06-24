/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Dockerode = require('dockerode');
import { NonComposeGroupName } from '../Containers';

export function getComposeProjectName(containerInfo: Dockerode.ContainerInfo): string {
    const labels = Object.keys(containerInfo.Labels)
        .map(label => ({ label: label, value: containerInfo.Labels[label] }));

    const composeProject = labels.find(l => l.label === 'com.docker.compose.project');
    if (composeProject) {
        return composeProject.value;
    } else {
        return NonComposeGroupName;
    }
}

export function getFullTagFromDigest(image: Dockerode.ImageInfo): string {
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

export function getContainerName(containerInfo: Dockerode.ContainerInfo): string {
    const names = containerInfo.Names.map(name => name.substr(1)); // Remove start '/'

    // Linked containers may have names containing '/'; their one "canonical" names will not.
    const canonicalName = names.find(name => name.indexOf('/') === -1);

    return canonicalName ?? names[0];
}
