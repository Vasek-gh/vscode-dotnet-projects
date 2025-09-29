import * as vscode from "vscode";
import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";

class ProjectItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description: string;
    public readonly project: Path;

    public constructor(project: Path) {
        this.label = project.getBaseName(true);
        this.description = project.uri.fsPath;
        this.project = project;
    }
}

export class ProjectSelector {
    public constructor(
        private readonly title: string,
        private readonly canSelectMany: boolean,
        private readonly itemsGet: () => Promise<Path[]>,
        private readonly itemsSet?: (items: Path[]) => Promise<void>
    ) {
    }

    public async execute(): Promise<Path[] | undefined> {
        const disposables: vscode.Disposable[] = [];
        try {
            const quickPick = vscode.window.createQuickPick<ProjectItem>();
            disposables.push(quickPick);

            quickPick.busy = true;
            quickPick.title = this.title;
            quickPick.canSelectMany = this.canSelectMany;
            quickPick.matchOnDescription = true;
            quickPick.show();

            quickPick.items = await this.getProjects();
            quickPick.busy = false;

            return await new Promise<Path[] | undefined>((resolve) => {
                disposables.push(
                    quickPick.onDidAccept(async () => {
                        const projects = quickPick.selectedItems.map(i => i.project);

                        quickPick.busy = true;
                        try {
                            await this.itemsSet?.(quickPick.selectedItems.map(i => i.project));
                        }
                        finally {
                            quickPick.busy = false;
                        }

                        resolve(projects);
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

    private async getProjects(): Promise<ProjectItem[]> {
        const projects = await this.itemsGet();

        return projects.map(p => new ProjectItem(p));
    }
}