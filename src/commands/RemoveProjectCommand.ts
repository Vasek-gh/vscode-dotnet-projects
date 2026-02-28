import { Logger } from "../tools/Logger";
import { Path } from "../tools/Path";
import { ProjectSelector } from "@src/selectors/ProjectSelector";
import { SelectorFactory } from "@src/selectors/SelectorFactory";
import { Command } from "./Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";

export class RemoveProjectCommand implements Command {
    public readonly id = "remove-project";

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
            "Select projects to remove",
            true,
            async () => await this.getProjects(solution),
            async (projects) => await this.setProjects(solution, projects)
        ).execute();
    }

    private async getProjects(solution: Path): Promise<Path[]> {
        const solutionProjects = await this.dotnet.getSolutionProjects(solution);

        return solutionProjects;
    }

    private async setProjects(solution: Path, projects: Path[]): Promise<void> {
        for (const project of projects) {
            await this.dotnet.removeProject(solution, project);
        }
    }
}