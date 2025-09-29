import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { ProjectSelector } from "@src/selectors/ProjectSelector";
import { Command } from "./Command";

export class AddProjectReferenceCommand implements Command {
    public readonly id = "add-project-reference";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const allProjects = await this.dotnet.getProjects();
        if (allProjects.length === 0) {
            this.logger.trace("Execution interrupted: Projects not found");
            return;
        }

        const project = await this.selectProject(allProjects);
        if (!project) {
            this.logger.trace("Execution interrupted: Selection cancelled");
            return;
        }

        await new ProjectSelector(
            "Select projects to add",
            true,
            async () => await this.getProjects(project, allProjects),
            async (projects) => await this.setProjects(project, projects)
        ).execute();
    }

    private async selectProject(allProjects: Path[]): Promise<Path | undefined> {
        const projects = await new ProjectSelector(
            "Select project",
            false,
            () => Promise.resolve(allProjects),
        ).execute();

        if (!projects || projects.length < 1) {
            return undefined;
        }

        return projects[0];
    }

    private async getProjects(project: Path, allProjects: Path[]): Promise<Path[]> {
        const currentReferences = await this.dotnet.getProjectReferences(project);
        const projects = allProjects.filter(p => !p.isSame(project) && !currentReferences.some(r => r.isSame(p)));

        return projects;
    }

    private async setProjects(project: Path, references: Path[]): Promise<void> {
        await this.dotnet.addProjectReference(project, references);
    }
}