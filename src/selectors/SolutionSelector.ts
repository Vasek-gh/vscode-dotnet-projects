import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { DefaultPreferencesService } from "@src/services/preferences/DefaultPreferencesService";
import { EntitiesKeys } from "@src/tools/EntitiesKeys";
import { FileSystemService } from "@src/services/file-system/FileSystemService";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";

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
    private readonly preferences: DefaultPreferencesService;

    public constructor(
        dotnet: DotnetService,
        fileSystem: FileSystemService,
        preferences: DefaultPreferencesService,
    ) {
        this.dotnet = dotnet;
        this.fileSystem = fileSystem;
        this.preferences = preferences;
    }

    public async execute(current: Path | undefined, force: boolean = false): Promise<Path | undefined> {
        if (!force) {
            const activeSolution = await this.getActiveSolution();
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

        return await QuickPickUtils.execute<SolutionItem, Path>((quickPick, resolve) => {
            quickPick.title = "Select solution";
            quickPick.items = solutions.map(s => new SolutionItem(s));

            return [
                quickPick.onDidHide(() => {
                    resolve(undefined);
                }),
                quickPick.onDidAccept(() => {
                    resolve(quickPick.selectedItems[0].path);
                }),
            ];
        });
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