/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { addDockerSettingsToEnv } from './addDockerSettingsToEnv';

export async function executeAsTask(context: IActionContext, command: string, name: string, addDockerEnv?: boolean, workspaceFolder?: vscode.WorkspaceFolder, cwd?: string): Promise<vscode.TaskExecution> {
    let newEnv: { [key: string]: string } | undefined;

    if (addDockerEnv) {
        // We don't need to merge process.env into newEnv, since ShellExecution does that automatically via ShellExecutionOptions
        newEnv = {};
        addDockerSettingsToEnv(newEnv, process.env);
    }

    const task = new vscode.Task(
        { type: 'shell' },
        workspaceFolder ?? vscode.TaskScope.Workspace,
        name,
        'Docker',
        new vscode.ShellExecution(command, { cwd: cwd || workspaceFolder.uri.fsPath, env: newEnv }),
        [] // problemMatchers
    );

    return vscode.tasks.executeTask(task);
}