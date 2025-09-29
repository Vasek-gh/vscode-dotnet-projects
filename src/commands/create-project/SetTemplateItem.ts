import { Path } from "@src/tools/Path";
import { State } from "./State";
import { TemplateSelector } from "./selectors/TemplateSelector";

export class SetTemplateItem {
    public label: string;
    public description: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly templateSelector: TemplateSelector,
    ) {
        this.label = "";
        this.description = "";

        this.applyState();
    }

    public async execute(): Promise<Path | undefined> {
        const template = await this.templateSelector.execute(this.state.template);
        if (template) {
            this.state.template = template;
            this.applyState();
        }

        return undefined;
    }

    private applyState(): void {
        this.label = "Template:";
        this.description = `${this.state.template.fullName}(${this.state.template.shortName}[${this.state.template.language}])`;
    }
}