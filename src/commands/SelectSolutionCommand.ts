import * as vscode from "vscode";
import { Logger } from "../tools/Logger";
import { Path } from "../tools/Path";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { PreferencesService } from "@src/services/PreferencesService";
import { EntitiesKeys } from "@src/tools/EntitiesKeys";
import { Command } from "./Command";

class SolutionItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description: string;
    public readonly buttons: vscode.QuickInputButton[];

    public constructor(
        public readonly path: Path,
        public readonly isDefault: boolean
    ) {
        this.label = path.getBaseName(true);
        this.description = path.uri.fsPath + (isDefault ? "\t[current]" : "");
        this.buttons = !isDefault
            ? []
            : [
                {
                    iconPath: new vscode.ThemeIcon("clear-all"),
                    tooltip: "Reset",
                }
            ];
    }
}

export class SelectSolutionCommand implements Command {
    public readonly id = "select-solution";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly preferences: PreferencesService
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const solutions = await this.dotnet.getSolutions();
        if (solutions.length === 0) {
            return; // todo warning
        }

        const currentDefault = this.preferences.getValue<string>(EntitiesKeys.activeSolution);
        const currentSolution = currentDefault === undefined
            ? undefined
            : Path.fromFile(vscode.Uri.file(currentDefault));

        const disposables: vscode.Disposable[] = [];
        try {
            await new Promise<Path | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<SolutionItem>();
                disposables.push(quickPick);

                quickPick.title = "Select default solution";
                quickPick.matchOnDescription = true;
                quickPick.items = solutions.map(s => {
                    const isDefault = currentSolution !== undefined && s.isSame(currentSolution);
                    return new SolutionItem(s, isDefault);
                });

                quickPick.show();

                disposables.push(
                    quickPick.onDidTriggerItemButton(() => {
                        this.preferences.setValue(EntitiesKeys.activeSolution, undefined);
                        resolve(undefined);
                    })
                );

                disposables.push(
                    quickPick.onDidAccept(() => {
                        const solution = quickPick.selectedItems[0].path;
                        this.preferences.setValue(EntitiesKeys.activeSolution, solution.uri.fsPath);
                        resolve(solution);
                    })
                );

                disposables.push(
                    quickPick.onDidHide(() => {
                        resolve(undefined);
                    })
                );
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }
}