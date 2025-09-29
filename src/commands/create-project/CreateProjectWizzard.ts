import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { Logger } from "@src/tools/Logger";
import { SolutionSelector } from "../../selectors/SolutionSelector";
import { TemplateSelector } from "./selectors/TemplateSelector";
import { CreateProjectWizzardItem } from "./CreateProjectWizzardItem";
import { State } from "./State";
import { SetSolutionItem } from "./SetSolutionItem";
import { CreateProjectButton } from "./CreateProjectButton";
import { SetTemplateItem } from "./SetTemplateItem";
import { ProjectDirectorySelector } from "./selectors/ProjectDirectorySelector";
import { SetDirectoryItem } from "./SetDirectoryItem";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Preferences } from "./Preferences";
import { SetAutoSolutionPrefixItem } from "./SetAutoSolutionPrefixItem";

export class CreateProjectWizzard {
    private readonly logger: Logger;
    private readonly dotnet: DotnetService;
    private readonly solutionSelector: SolutionSelector;
    private readonly templateSelector: TemplateSelector;
    private readonly directorySelector: ProjectDirectorySelector;
    private readonly preferences: Preferences;

    public constructor(
        logger: Logger,
        preferences: Preferences,
        dotnet: DotnetService,
        solutionSelector: SolutionSelector,
        templateSelector: TemplateSelector,
        directorySelector: ProjectDirectorySelector,
    ) {
        this.logger = logger.create(this);
        this.preferences = preferences;
        this.dotnet = dotnet;
        this.solutionSelector = solutionSelector;
        this.templateSelector = templateSelector;
        this.directorySelector = directorySelector;
    }

    public async show(): Promise<Path | undefined> {
        let state = await this.prepareState();
        if (state === undefined) {
            return undefined;
        }

        const items = this.prepareItems(state);

        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<Path | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
                disposables.push(quickPick);

                quickPick.title = "Create project or change settings";
                quickPick.placeholder = "Enter new project name";
                quickPick.ignoreFocusOut = true;
                quickPick.keepScrollPosition = true;
                (quickPick as any).sortByLabel = false;
                quickPick.items = items;
                quickPick.value = state.value;
                quickPick.show();

                disposables.push(
                    quickPick.onDidChangeValue((value) => {
                        state.value = value;
                    })
                );

                disposables.push(
                    quickPick.onDidAccept(async () => {
                        if (quickPick.selectedItems.length === 0) {
                            return;
                        }

                        state.lockResolve = true;
                        quickPick.busy = true;
                        try {
                            const selectedItem = quickPick.selectedItems[0] as CreateProjectWizzardItem;

                            const project = await selectedItem.execute(state);
                            if (!project) {
                                quickPick.items = items;
                                quickPick.value = state.value;
                                quickPick.activeItems = [selectedItem];
                                quickPick.show();
                                return;
                            }

                            resolve(project);
                        }
                        catch (e) {
                            this.logger.exception(e);
                        }
                        finally {
                            quickPick.busy = false;
                            state.lockResolve = false;
                        }
                    })
                );

                disposables.push(
                    quickPick.onDidHide(() => {
                        if (!state.lockResolve) {
                            resolve(undefined);
                        }
                    })
                );
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }

    private async prepareState(): Promise<State | undefined> {
        return (await this.dotnet.getSolutions()).length > 0
            ? this.prepareStateBySolution()
            : this.prepareStateByDirectory();
    }

    private async prepareStateByDirectory(): Promise<State | undefined> {
        const template = await this.templateSelector.execute(undefined);
        if (!template) {
            return undefined;
        }

        const directory = await this.directorySelector.execute(undefined, undefined);
        if (!directory) {
            return undefined;
        }

        return {
            value: "",
            solution: undefined,
            directory: directory,
            template: template,
            autoSolutionPrefix: false,
            lockResolve: false
        };
    }

    private async prepareStateBySolution(): Promise<State | undefined> {
        const template = await this.templateSelector.execute(undefined);
        if (!template) {
            return undefined;
        }

        const solution = await this.solutionSelector.execute(undefined);
        if (!solution) {
            return undefined;
        }

        return {
            value: "",
            solution: solution,
            directory: await this.directorySelector.getSolutionDefaultDir(solution),
            template: template,
            autoSolutionPrefix: this.preferences.getAutoSolutionPrefix(),
            lockResolve: false
        };
    }

    private prepareItems(state: State): vscode.QuickPickItem[] {
        const directoryItem = this.createDirectoryItem(state);

        const result: vscode.QuickPickItem[] = [
            this.createProjectItem(state),
            {
                label: "Settings",
                kind: vscode.QuickPickItemKind.Separator,
                alwaysShow: true,
            },
            directoryItem,

        ];

        if (state.solution !== undefined) {
            result.push(this.createSolutionItem(state, directoryItem));
        }

        result.push(this.createTemplateItem(state));

        if (state.solution !== undefined) {
            result.push(this.createAutoSolutionPrefix(state));
        }

        return result;
    }

    private createProjectItem(state: State): CreateProjectButton {
        return new CreateProjectButton(
            state,
            this.preferences,
            this.dotnet
        );
    }

    private createDirectoryItem(state: State): SetDirectoryItem {
        return new SetDirectoryItem(
            state,
            this.directorySelector,
        );
    }

    private createSolutionItem(state: State, directoryItem: SetDirectoryItem): SetSolutionItem {
        return new SetSolutionItem(
            state,
            directoryItem,
            this.solutionSelector
        );
    }

    private createTemplateItem(state: State): SetTemplateItem {
        return new SetTemplateItem(
            state,
            this.templateSelector,
        );
    }

    private createAutoSolutionPrefix(state: State): SetAutoSolutionPrefixItem {
        return new SetAutoSolutionPrefixItem(
            state
        );
    }
}