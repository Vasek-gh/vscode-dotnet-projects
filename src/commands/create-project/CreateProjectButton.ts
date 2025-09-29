import { Path } from "@src/tools/Path";
import { CreateProjectWizzardItem } from "./CreateProjectWizzardItem";
import { State } from "./State";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Preferences } from "./Preferences";

export class CreateProjectButton implements CreateProjectWizzardItem {
    public label: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly preferences: Preferences,
        private readonly dotnetService: DotnetService
    ) {
        this.label = "Create project";
    }

    public async execute(): Promise<Path | undefined> {
        const name = this.state.solution !== undefined && this.state.autoSolutionPrefix
            ? `${this.state.solution.getBaseName(true)}.${this.state.value}`
            : this.state.value;

        const directory = this.state.directory.appendDir(name);

        const commandResult = await this.dotnetService.createProject(
            this.state.template,
            directory.getParentDirectory(),
            directory.getBaseName(true)
        );

        if (
            !await commandResult.showError("Create project fail", true)
            && commandResult.data
            && this.state.solution !== undefined
        ) {
            const addCommandResult = await this.dotnetService.addProject(this.state.solution, commandResult.data, false);
            addCommandResult.showError("The project was created but not added to the solution.", false);
        }

        this.preferences.pushTemplateToFavorites(this.state.template);

        return commandResult.data;
    }
}
