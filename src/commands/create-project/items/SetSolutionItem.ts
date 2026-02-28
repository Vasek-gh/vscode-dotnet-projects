import { Path } from "@src/tools/Path";
import { SolutionSelector } from "../../../selectors/SolutionSelector";
import { State } from "./State";
import { SetDirectoryItem } from "./SetDirectoryItem";

export class SetSolutionItem {
    public label: string;
    public description: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly directoryItem: SetDirectoryItem,
        private readonly solutionSelector: SolutionSelector,
    ) {
        this.label = "";
        this.description = "";

        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        const solution = await this.solutionSelector.execute(this.state.solution, true);
        if (solution) {
            await this.directoryItem.applySolution(solution);
            this.state.solution = solution;
            this.applyState();
        }

        return undefined;
    }

    private applyState(): void {
        this.label = "Solution:";
        this.description = this.state.solution?.uri.fsPath ?? "<none>";
    }
}