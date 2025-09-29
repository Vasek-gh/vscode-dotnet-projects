import { Path } from "@src/tools/Path";
import { State } from "./State";
import { FormatSelector } from "./selectors/FormatSelector";

export class SetFormatItem {
    public label: string = "";
    public description: string = "";
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly formatSelector: FormatSelector,
    ) {
        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        const template = await this.formatSelector.execute(this.state.format);
        if (template) {
            this.state.format = template;
            this.applyState();
        }

        return undefined;
    }

    private applyState(): void {
        this.label = "Format:";
        this.description = this.state.format.title;
    }
}