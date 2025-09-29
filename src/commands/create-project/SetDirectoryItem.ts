import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { CreateProjectWizzardItem } from "./CreateProjectWizzardItem";
import { State } from "./State";
import { ProjectDirectorySelector } from "./selectors/ProjectDirectorySelector";

export class SetDirectoryItem implements CreateProjectWizzardItem {
    public label: string;
    public description: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly directorySelector: ProjectDirectorySelector,
    ) {
        this.label = "";
        this.description = "";

        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        const directory = await this.directorySelector.execute(this.state.solution, this.state.directory);
        if (directory) {
            this.state.directory = directory;
            this.applyState();
        }

        return undefined;
    }

    public async applySolution(solution: Path): Promise<void> {
        this.state.directory = await this.directorySelector.getSolutionDefaultDir(solution);
        this.applyState();
    }

    private applyState(): void {
        this.label = "Directory:";
        this.description = this.state.directory.uri.fsPath;
    }
}