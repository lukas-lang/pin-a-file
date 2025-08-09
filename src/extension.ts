import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;

const FILE_SELECTOR_FILE = 'fileSelector.json';

export function activate(context: vscode.ExtensionContext) {
    const getFileCmd = vscode.commands.registerCommand('fileSelector.selectedFile', () => {
        return getSelectedFile() || '';
    });
    context.subscriptions.push(getFileCmd);

    const changeFileCmd = vscode.commands.registerCommand('fileSelector.changeSelectedFile', async () => {
        if (!getSettingsFilePath()) {
            vscode.window.showErrorMessage('No workspace is open. Please open a folder or workspace first.');
            return;
        }

        const selected = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select file'
        });
        if (selected && selected.length > 0) {
            await saveSelectedFile(selected[0].fsPath);
            updateStatusBar();
        }
    });
    context.subscriptions.push(changeFileCmd);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    statusBarItem.command = 'fileSelector.changeSelectedFile';
    context.subscriptions.push(statusBarItem);

    updateStatusBar();
}

function getSettingsFilePath(): string | undefined {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const vscodeDir = path.join(workspaceRoot, '.vscode');

    return path.join(vscodeDir, FILE_SELECTOR_FILE);
}

function getSelectedFile(): string | undefined {
    const settingsPath = getSettingsFilePath();
    if (!settingsPath || !fs.existsSync(settingsPath)) {
        return undefined;
    }
    try {
        const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        let file = data.selectedFile;

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

async function saveSelectedFile(filePath: string) {
    const settingsPath = getSettingsFilePath();
    if (!settingsPath) { return; }
    fs.mkdirSync(path.dirname(settingsPath));

    let storedPath = filePath;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const wsPath = workspaceFolder.uri.fsPath;
        if (filePath.startsWith(wsPath)) {
            storedPath = filePath.replace(wsPath, '${workspaceFolder}');
        }
    }

    fs.writeFileSync(settingsPath, JSON.stringify({ selectedFile: storedPath }, null, 2), 'utf8');
}

function updateStatusBar() {
    if (!getSettingsFilePath()) {
        statusBarItem.text = "$(file) No workspace opened";
    }
    else {
        const file = getSelectedFile();
        if (file) {
            statusBarItem.text = `$(file) ${path.basename(file)}`;
            statusBarItem.tooltip = `Selected file: ${file}`;
        } else {
            statusBarItem.text = `$(file) No file selected`;
        }
    }

    statusBarItem.show();
}

export function deactivate() { }