/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtParentTreeItem, AzExtTreeItem, IActionContext } from "vscode-azureextensionui";
import { builtInNetworks } from "../../constants";
import { DockerNetwork } from "../../docker/Networks";
import { ext } from "../../extensionVariables";
import { getThemedIconPath, IconPath } from '../IconPath';

export class NetworkTreeItem extends AzExtTreeItem {
    public static allContextRegExp: RegExp = /Network$/;
    public static customNetworkRegExp: RegExp = /^customNetwork$/i;

    private readonly _item: DockerNetwork;

    public constructor(parent: AzExtParentTreeItem, itemInfo: DockerNetwork) {
        super(parent);
        this._item = itemInfo;
    }

    public get contextValue(): string {
        return builtInNetworks.includes(this._item.name) ? 'defaultNetwork' : 'customNetwork';
    }

    public get id(): string {
        return this._item.treeId;
    }

    public get networkId(): string {
        return this._item.id;
    }

    public get createdTime(): number {
        return this._item.createdTime;
    }

    public get networkName(): string {
        return this._item.name;
    }

    public get label(): string {
        return ext.networksRoot.getTreeItemLabel(this._item);
    }

    public get description(): string | undefined {
        return ext.networksRoot.getTreeItemDescription(this._item);
    }

    public get iconPath(): IconPath {
        return getThemedIconPath('network');
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        return ext.dockerClient.removeNetwork(context, this.networkId);
    }
}
