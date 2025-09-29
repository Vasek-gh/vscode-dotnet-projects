import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { ProjectSelector } from "@src/selectors/ProjectSelector";
import { SelectorFactory } from "@src/selectors/SelectorFactory";
import { Command } from "./Command";

export class AddProjectCommand implements Command {
    public readonly id = "add-project";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly selectorFactory: SelectorFactory,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const solution = await this.selectorFactory.createSolutionSelector().execute(undefined);
        if (!solution) {
            this.logger.trace("Execution interrupted: Solution not found");
            return;
        }

        await new ProjectSelector(
            "Select projects to add",
            true,
            async () => await this.getProjects(solution),
            async (projects) => await this.setProjects(solution, projects)
        ).execute();
    }

    private async getProjects(solution: Path): Promise<Path[]> {
        const allProjects = await this.dotnet.getProjects();
        const solutionProjects = await this.dotnet.getSolutionProjects(solution);
        const missingProjects = allProjects.filter(p => !solutionProjects.some(sp => sp.isSame(p)));

        return missingProjects;
    }

    private async setProjects(solution: Path, projects: Path[]): Promise<void> {
        for (const project of projects) {
            await this.dotnet.addProject(solution, project, false);
        }
    }
}