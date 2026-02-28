import { Path } from "@src/tools/Path";
import { State } from "./State";
import { DirectorySelector } from "@src/selectors/DirectorySelector";

export class SetDirectoryItem {
    public label: string = "";
    public description: string = "";
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly directorySelector: DirectorySelector,
    ) {
        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        const directory = await this.directorySelector.execute(this.state.directory);
        if (directory) {
            this.state.directory = directory;
            this.applyState();
        }

        return undefined;
    }

    private applyState(): void {
        this.label = "Directory:";
        this.description = this.state.directory.uri.fsPath;
    }
}