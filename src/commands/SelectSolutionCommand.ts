import * as vscode from "vscode";
import { Logger } from "../tools/Logger";
import { Path } from "../tools/Path";
import { DefaultPreferencesService } from "@src/services/preferences/DefaultPreferencesService";
import { Command } from "./Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";

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
        private readonly preferences: DefaultPreferencesService
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const solutions = await this.dotnet.getSolutions();
        if (solutions.length === 0) {
            return; // todo warning
        }

        const currentSolution = this.preferences.getActiveSolution();

        await QuickPickUtils.execute<SolutionItem, Path>((quickPick, resolve) => {
            quickPick.title = "Select default solution";
            quickPick.matchOnDescription = true;
            quickPick.items = solutions.map(s => {
                const isDefault = currentSolution !== undefined && s.isSame(currentSolution);
                return new SolutionItem(s, isDefault);
            });

            return [
                quickPick.onDidHide(() => {
                    resolve(undefined);
                }),
                quickPick.onDidTriggerItemButton(() => {
                    this.preferences.setActiveSolution(undefined);
                    resolve(undefined);
                }),
                quickPick.onDidAccept(() => {
                    const solution = quickPick.selectedItems[0].path;
                    this.preferences.setActiveSolution(solution);
                    resolve(solution);
                }),
            ];
        });
    }
}