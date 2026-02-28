import { Path } from "@src/tools/Path";
import { State } from "./State";

export class SetCreateSolutionItem {
    public label: string;
    public description: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
    ) {
        this.label = "";
        this.description = "";

        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        this.state.createSolution = !this.state.createSolution;
        this.applyState();

        return undefined;
    }

    private applyState(): void {
        this.label = "Create solution:";
        this.description = `${this.state.createSolution}`;
    }
}