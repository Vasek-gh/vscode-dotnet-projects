import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { Logger } from "@src/tools/Logger";
import { WizzardItem } from "./WizzardItem";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { DirectorySelector } from "@src/selectors/DirectorySelector";
import { FormatSelector } from "./selectors/FormatSelector";
import { SetDirectoryItem } from "./SetDirectoryItem";
import { State } from "./State";
import { SetFormatItem } from "./SetFormatItem";
import { CreateSolutionButton } from "./CreateSolutionButton";

export class Wizzard {
    private readonly logger: Logger;
    private readonly dotnetService: DotnetService;
    private readonly formatSelector: FormatSelector;
    private readonly directorySelector: DirectorySelector;

    public constructor(
        logger: Logger,
        dotnetService: DotnetService,
        formatSelector: FormatSelector,
        directorySelector: DirectorySelector,
    ) {
        this.logger = logger.create(this);
        this.dotnetService = dotnetService;
        this.formatSelector = formatSelector;
        this.directorySelector = directorySelector;
    }

    public async show(): Promise<Path | undefined> {
        const directory = await this.directorySelector.execute(undefined);
        if (!directory) {
            return undefined;
        }

        let state = {
            value: "",
            directory: directory,
            format: this.formatSelector.getDefault(),
            lockResolve: false
        };

        const items = [
            this.createSolutionItem(state),
            {
                label: "Settings",
                kind: vscode.QuickPickItemKind.Separator,
                alwaysShow: true,
            },
            this.createDirectoryItem(state),
            this.createFormatItem(state)
        ];

        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<Path | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
                disposables.push(quickPick);

                quickPick.title = "Create solution";
                quickPick.placeholder = "Enter new solution name";
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
                            const selectedItem = quickPick.selectedItems[0] as WizzardItem;

                            const solution = await selectedItem.execute(state);
                            if (!solution) {
                                quickPick.items = items;
                                quickPick.value = state.value;
                                quickPick.activeItems = [selectedItem];
                                quickPick.show();
                                return;
                            }

                            resolve(solution);
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

    private createSolutionItem(state: State): CreateSolutionButton {
        return new CreateSolutionButton(
            state,
            this.dotnetService
        );
    }

    private createDirectoryItem(state: State): SetDirectoryItem {
        return new SetDirectoryItem(
            state,
            this.directorySelector,
        );
    }

    private createFormatItem(state: State): SetFormatItem {
        return new SetFormatItem(
            state,
            this.formatSelector,
        );
    }
}