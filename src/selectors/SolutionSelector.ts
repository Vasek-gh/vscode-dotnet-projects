import * as vscode from "vscode";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Path } from "@src/tools/Path";
import { PreferencesService } from "@src/services/PreferencesService";
import { EntitiesKeys } from "@src/tools/EntitiesKeys";
import { FileSystemService } from "@src/services/file-system/FileSystemService";

class SolutionItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description: string;

    public constructor(
        public readonly path: Path,
    ) {
        this.label = path.getBaseName(true);
        this.description = path.uri.fsPath;
    }
}

export class SolutionSelector {
    private readonly dotnet: DotnetService;
    private readonly fileSystem: FileSystemService;
    private readonly preferences: PreferencesService;

    public constructor(
        dotnet: DotnetService,
        fileSystem: FileSystemService,
        preferences: PreferencesService,
    ) {
        this.dotnet = dotnet;
        this.fileSystem = fileSystem;
        this.preferences = preferences;
    }

    public async execute(current: Path | undefined, force: boolean = false): Promise<Path | undefined> {
        if (!force) {
            const activeSolution = this.getActiveSolution();
            if (activeSolution) {
                return activeSolution;
            }
        }

        let solutions = await this.dotnet.getSolutions();
        if (solutions.length === 0) {
            return undefined;
        }

        if (current) {
            solutions = [
                current,
                ...solutions.filter(s => !s.isSame(current))
            ];
        }

        if (solutions.length === 1) {
            return solutions[0];
        }

        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<Path | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<SolutionItem>();
                quickPick.title = "Select solution";
                quickPick.items = solutions.map(s => new SolutionItem(s));
                quickPick.show();

                disposables.push(
                    quickPick.onDidAccept(() => {
                        resolve(quickPick.selectedItems[0].path);
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

    private async getActiveSolution(): Promise<Path | undefined> {
        const activeSolution = await this.preferences.getValue<string>(EntitiesKeys.activeSolution);
        if (!activeSolution) {
            return undefined;
        }

        var solutionPath = Path.fromFile(vscode.Uri.file(activeSolution));
        return this.fileSystem.getStat(solutionPath) === undefined
            ? undefined
            : solutionPath;
    }
}