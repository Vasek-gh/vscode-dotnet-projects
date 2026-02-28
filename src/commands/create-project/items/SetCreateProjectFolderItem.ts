import { Path } from "@src/tools/Path";
import { State } from "./State";

export class SetCreateProjectFolderItem {
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
        this.state.createProjectFolder = !this.state.createProjectFolder;
        this.applyState();

        return undefined;
    }

    private applyState(): void {
        this.label = "Create project folder:";
        this.description = `${this.state.createProjectFolder}`;
    }
}