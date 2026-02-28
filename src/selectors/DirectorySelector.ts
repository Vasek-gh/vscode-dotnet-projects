import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";

class DirectoryItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly directory: Path;
    public readonly description?: string;
    public readonly kind: vscode.QuickPickItemKind;

    public constructor(
        label: string,
        directory: Path,
        separator: boolean,
        description?: string,
    ) {
        this.label = label;
        this.directory = directory;
        this.description = description;
        this.kind = separator ? vscode.QuickPickItemKind.Separator : vscode.QuickPickItemKind.Default;
    }

    public getValue(): Path {
        return this.directory;
    }
}

export class DirectorySelector {
    public constructor(
    ) {
    }

    public async execute(current: Path | undefined): Promise<Path | undefined> {
        const items = await this.getItems();
        if (items.length === 0) {
            return undefined;
        }

        if (items.length === 1) {
            return items[0].directory;
        }

        const currentItem = items.find(i =>
            current !== undefined
            && i.kind !== vscode.QuickPickItemKind.Separator
            && i.directory.isSame(current)
        );

        return await QuickPickUtils.executeSelector(
            "Select directory",
            "Start typing for filtering",
            items,
            currentItem
        );
    }

    private async getItems(): Promise<DirectoryItem[]> {
        if (vscode.workspace.workspaceFolders === undefined) {
            return [];
        }

        const result: DirectoryItem[] = [];
        const multiRoot = vscode.workspace.workspaceFolders.length > 1;

        for (const wsFolder of vscode.workspace.workspaceFolders) {
            const path = Path.fromDir(wsFolder.uri);

            if (multiRoot) {
                result.push(new DirectoryItem(wsFolder.name, path, true));
            }

            result.push(new DirectoryItem("./", path, false, path.toString()));

            await this.scanDirs(path, path, result);
        }

        return result;
    }

    private async scanDirs(root: Path, parent: Path, items: DirectoryItem[]): Promise<void> {
        const dirItems = await vscode.workspace.fs.readDirectory(parent.uri);
        for (const dirItem of dirItems) {
            if (dirItem[1] !== vscode.FileType.Directory) {
                continue;
            }

            const path = parent.appendDir(dirItem[0]);
            const relativePart = path.getRelative(root);
            if (!relativePart) {
                continue;
            }

            items.push(new DirectoryItem(relativePart, path, false, path.toString()));

            await this.scanDirs(root, path, items);
        }
    }
}