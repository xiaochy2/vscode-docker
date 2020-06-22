/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ImageInfo } from "dockerode";

// eslint-disable-next-line @typescript-eslint/tslint/config
export function getFullTagFromDigest(image: ImageInfo): string {
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
