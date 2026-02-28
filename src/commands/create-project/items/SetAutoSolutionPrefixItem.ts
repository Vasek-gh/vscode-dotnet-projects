import { Path } from "@src/tools/Path";
import { State } from "./State";

export class SetAutoSolutionPrefixItem {
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
        this.state.autoSolutionPrefix = !this.state.autoSolutionPrefix;
        this.applyState();

        return undefined;
    }

    private applyState(): void {
        this.label = "Append solution name:";
        this.description = `${this.state.autoSolutionPrefix}`;
    }
}