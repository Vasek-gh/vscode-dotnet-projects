import * as vscode from "vscode";
import { Logger } from "./Logger";

interface QuickPickItem<T> extends vscode.QuickPickItem {
    getValue(): T;
}

interface WizzardItem<TState, TResult> extends vscode.QuickPickItem {
    execute(state: TState): Promise<TResult | undefined>;
}

interface WizzardState {
    value: string;
    lockHide: boolean;
}

export class QuickPickUtils {
    public static async execute<TResult>(
        configure: (quickPick: vscode.QuickPick<vscode.QuickPickItem>, resolve: (result: TResult | undefined) => void) => vscode.Disposable[]
    ) : Promise<TResult | undefined>;

    public static async execute<TItem extends vscode.QuickPickItem, TResult>(
        configure: (quickPick: vscode.QuickPick<TItem>, resolve: (result: TResult | undefined) => void) => vscode.Disposable[]
    ) : Promise<TResult | undefined>;

    public static async execute<TItem extends vscode.QuickPickItem, TResult>(
        configure: (quickPick: vscode.QuickPick<TItem>, resolve: (result: TResult | undefined) => void) => vscode.Disposable[]
    ) : Promise<TResult | undefined> {
        const disposables: vscode.Disposable[] = [];
        try {
            const quickPick = vscode.window.createQuickPick<TItem>();
            disposables.push(quickPick);

            return await new Promise<TResult | undefined>((resolve) => {
                var handlers = configure(quickPick, resolve);
                disposables.push(...handlers);

                quickPick.show();
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }

    public static async executeSelector<T>(
        title: string,
        placeholder: string,
        items: QuickPickItem<T>[],
        current?: QuickPickItem<T>
    ): Promise<T | undefined> {
        return await QuickPickUtils.execute<QuickPickItem<T>, T>((quickPick, resolve) => {
            quickPick.title = title;
            quickPick.placeholder = placeholder;
            (quickPick as any).sortByLabel = false;

            quickPick.items = items;
            if (current) {
                quickPick.activeItems = [ current ];
            }

            return [
                quickPick.onDidHide(() => {
                    resolve(undefined);
                }),
                quickPick.onDidAccept(() => {
                    resolve(quickPick.selectedItems[0].getValue());
                }),
            ];
        });
    }

    public static async executeWizzard<TState extends WizzardState, TResult>(
        logger: Logger,
        title: string,
        placeholder: string,
        state: TState,
        items: vscode.QuickPickItem[]
    ): Promise<TResult | undefined> {
        return await QuickPickUtils.execute<TResult>((quickPick, resolve) => {
            quickPick.title = title;
            quickPick.placeholder = placeholder;
            quickPick.ignoreFocusOut = true;
            quickPick.keepScrollPosition = true;
            (quickPick as any).sortByLabel = false;
            quickPick.items = items;
            quickPick.value = state.value;

            return [
                quickPick.onDidHide(() => {
                    if (!state.lockHide) {
                        resolve(undefined);
                    }
                }),
                quickPick.onDidChangeValue((value) => {
                    state.value = value;
                }),
                quickPick.onDidAccept(async () => {
                    if (quickPick.selectedItems.length === 0) {
                        return;
                    }

                    state.lockHide = true;
                    quickPick.busy = true;
                    try {
                        const selectedItem = quickPick.selectedItems[0] as WizzardItem<TState, TResult>;

                        const result = await selectedItem.execute(state);
                        if (!result) {
                            quickPick.items = items;
                            quickPick.value = state.value;
                            quickPick.activeItems = [selectedItem];
                            quickPick.show();
                            return;
                        }

                        resolve(result);
                    }
                    catch (e) {
                        logger.exception(e);
                    }
                    finally {
                        quickPick.busy = false;
                        state.lockHide = false;
                    }
                })
            ];
        });
    }
}