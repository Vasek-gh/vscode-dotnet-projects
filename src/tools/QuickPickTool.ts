import * as vscode from "vscode";

interface QuickPickItem<T> extends vscode.QuickPickItem {
    getValue(): T;
}

export class QuickPickTool {
    public static async execute<T>(
        title: string,
        placeholder: string,
        items: QuickPickItem<T>[],
        current?: QuickPickItem<T>
    ): Promise<T | undefined> {
        const disposables: vscode.Disposable[] = [];
        try {
            return await new Promise<T | undefined>((resolve) => {
                const quickPick = vscode.window.createQuickPick<QuickPickItem<T>>();
                quickPick.title = title;
                quickPick.placeholder = placeholder;
                (quickPick as any).sortByLabel = false;

                quickPick.items = items;
                if (current) {
                    quickPick.activeItems = [ current ];
                }

                quickPick.show();

                disposables.push(
                    quickPick.onDidAccept(() => {
                        resolve(quickPick.selectedItems[0].getValue());
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
}