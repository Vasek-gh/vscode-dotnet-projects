import * as vscode from "vscode";
import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";
import { ProjectSelector } from "@src/selectors/ProjectSelector";
import { Command } from "./Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";

export class RemoveProjectReferencesCommand implements Command {
    public readonly id = "remove-project-reference";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const project = await this.selectProject();
        if (!project) {
            return;
        }

        await new ProjectSelector(
            "Select projects to remove",
            true,
            async () => this.getProjects(project),
            async (projects) => await this.setProjects(project, projects)
        ).execute();
    }

    private async selectProject(): Promise<Path | undefined> {
        const projects = await new ProjectSelector(
            "Select project",
            false,
            async () => await this.dotnet.getProjects(),
        ).execute();

        if (!projects || projects.length < 1) {
            return undefined;
        }

        return projects[0];
    }

    private async getProjects(project: Path): Promise<Path[]> {
        const projects = await this.dotnet.getProjectReferences(project);

        return projects;
    }

    private async setProjects(project: Path, references: Path[]): Promise<void> {
        await this.dotnet.removeProjectReference(project, references);
    }
}