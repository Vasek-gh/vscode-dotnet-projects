import * as vscode from "vscode";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Path } from "@src/tools/Path";
import { Utils } from "@src/tools/Utils";
import { DirectorySelector } from "@src/selectors/DirectorySelector";

class DirectoryItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly directory: Path;

    public constructor(
        solution: Path,
        directory: Path
    ) {
        this.label = directory.getRelative(solution) ?? directory.uri.fsPath;
        this.directory = directory;
    }
}

export class ProjectDirectorySelector {
    public constructor(
        private readonly dotnet: DotnetService,
        private readonly directorySelector: DirectorySelector
    ) {
    }

    public async execute(solution: Path | undefined, current: Path | undefined): Promise<Path | undefined> {
        if (solution === undefined) {
            return await this.directorySelector.execute(current);
        }

        let dirs = await this.getPossibleDirs(solution);
        if (dirs.length === 0) {
            return undefined;
        }

        if (current) {
            dirs = [
                current,
                ...dirs.filter(d => !d.isSame(current))
            ];
        }

        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<Path | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<DirectoryItem>();
                quickPick.title = "Select directory";
                quickPick.items = dirs.map(d => new DirectoryItem(solution, d));
                quickPick.show();

                disposables.push(
                    quickPick.onDidAccept(() => {
                        resolve(quickPick.selectedItems[0].directory);
                        quickPick.dispose();
                    })
                );

                disposables.push(
                    quickPick.onDidHide(() => {
                        resolve(undefined);
                        quickPick.dispose();
                    })
                );
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }

    public async getSolutionDefaultDir(solution: Path): Promise<Path> {
        const wsRoot = Utils.getRootDirectory(solution);
        const possibleDirs = (await this.getPossibleDirs(solution))
            .filter(d => wsRoot === undefined || d.getRelative(wsRoot) !== undefined);

        return possibleDirs.length !== 0
            ? possibleDirs[0]
            : solution.getDirectory();
    }

    private async getPossibleDirs(solution: Path): Promise<Path[]> {
        const wsDir = Utils.getRootDirectory(solution);
        if (wsDir === undefined) {
            return [];
        }

        const projects = await this.dotnet.getSolutionProjects(solution);
        const rootDirs = projects.filter(
            p => {
                return !p.getDirectory().isSame(solution.getDirectory());
            })
            .map(
                p => {
                    return p.getDirectory().getParentDirectory(); // todo check root
                }
            );

        const map = new Map<string, { path: Path; count: number }>();
        for (const dir of rootDirs) {
            const pathInfo = map.get(dir.fullPath) ?? {
                path: dir,
                count: 0
            };

            pathInfo.count++;
            map.set(dir.fullPath, pathInfo);
        }

        const result = Array.from(map)
            .sort(p => p[1].count)
            .map(p => p[1].path)
            .slice(0, 2);

        return result;
    }
}