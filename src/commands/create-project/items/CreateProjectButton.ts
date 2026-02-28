import { Path } from "@src/tools/Path";
import { State } from "./State";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Utils } from "@src/tools/Utils";
import { PreferencesService } from "@src/services/preferences/PreferencesService";

export class ExecuteButton {
    public label: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly preferences: PreferencesService,
        private readonly dotnetService: DotnetService
    ) {
        this.label = "Create project";
    }

    public async execute(): Promise<Path | undefined> {
        let name = this.state.value;
        if (!name && !this.state.solution) {
            name = this.state.directory.getBaseName();
        }

        if (!name) {
            Utils.showErrorMessage("Create project", "Provide a project name", true);
            return undefined;
        }

        if (this.state.solution !== undefined && this.state.autoSolutionPrefix) {
            name = `${this.state.solution.getBaseName(true)}.${name}`;
        }

        const directory = this.state.createProjectFolder
            ? this.state.directory.appendDir(name)
            : this.state.directory;

        const commandResult = await this.dotnetService.createProject(
            this.state.template,
            directory.getParentDirectory(),
            directory.getBaseName(true)
        );

        if (await commandResult.handleError("Create project fail", true) || !commandResult.data) {
            return undefined;
        }

        let solution = this.state.solution;
        if (!solution && this.state.createSolution) {
            solution = await this.createSolution(this.state.directory, name);
        }

        if (solution) {
            const addCommandResult = await this.dotnetService.addProject(solution, commandResult.data, false);
            addCommandResult.handleError("The project was created but not added to the solution.", false);
        }

        return commandResult.data;
    }

    private async createSolution(directory: Path, projectName: string): Promise<Path | undefined> {
        var format = this.preferences.getSolutionFormat();

        var result = await this.dotnetService.createSolution(directory, projectName, format);
        result.handleError("Fail to create solution", false);

        return result.data;
    }
}
