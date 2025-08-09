import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;

const PIN_A_FILE_SETTINGS_FILE = 'pinFile.json';

export function activate(context: vscode.ExtensionContext) {
    const getFileCmd = vscode.commands.registerCommand('pinFile.pinnedFile', () => {
        return getPinnedFile() || '';
    });
    context.subscriptions.push(getFileCmd);

    const changeFileCmd = vscode.commands.registerCommand('pinFile.changePinnedFile', async () => {
        if (!getSettingsFilePath()) {
            vscode.window.showErrorMessage('No workspace is open. Please open a folder or workspace first.');
            return;
        }

        const selected = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select file to pin'
        });
        if (selected && selected.length > 0) {
            await savePinnedFile(selected[0].fsPath);
            updateStatusBar();
        }
    });
    context.subscriptions.push(changeFileCmd);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    statusBarItem.command = 'pinFile.changePinnedFile';
    context.subscriptions.push(statusBarItem);

    updateStatusBar();
}

function getSettingsFilePath(): string | undefined {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const vscodeDir = path.join(workspaceRoot, '.vscode');

    return path.join(vscodeDir, PIN_A_FILE_SETTINGS_FILE);
}

function getPinnedFile(): string | undefined {
    const settingsPath = getSettingsFilePath();
    if (!settingsPath || !fs.existsSync(settingsPath)) {
        return undefined;
    }
    try {
        const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        let file = data.pinnedFile;

        if (file && file.startsWith('${workspaceFolder}')) {
            const wsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (wsPath) {
                file = file.replace('${workspaceFolder}', wsPath);
            }
        }

        return file;
    } catch {
        return undefined;
    }
}

async function savePinnedFile(filePath: string) {
    const settingsPath = getSettingsFilePath();
    if (!settingsPath) { return; }

    if (!fs.existsSync(path.dirname(settingsPath))) {
        fs.mkdirSync(path.dirname(settingsPath));
    }

    let storedPath = filePath;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const wsPath = workspaceFolder.uri.fsPath;
        if (filePath.startsWith(wsPath)) {
            storedPath = filePath.replace(wsPath, '${workspaceFolder}');
        }
    }

    fs.writeFileSync(settingsPath, JSON.stringify({ pinnedFile: storedPath }, null, 2), 'utf8');
}

function updateStatusBar() {
    if (!getSettingsFilePath()) {
        statusBarItem.text = "$(timeline-pin) No workspace opened";
    }
    else {
        const file = getPinnedFile();
        if (file) {
            statusBarItem.text = `$(timeline-unpin) ${path.basename(file)}`;
            statusBarItem.tooltip = `Pinned file: ${file}`;
        } else {
            statusBarItem.text = `$(timeline-pin) No file pinned`;
        }
    }

    statusBarItem.show();
}

export function deactivate() { }