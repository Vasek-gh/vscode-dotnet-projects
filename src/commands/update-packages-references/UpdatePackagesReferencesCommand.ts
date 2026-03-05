import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";
import { Command } from "../Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";
import { PreferencesService } from "@src/services/preferences/PreferencesService";
import { ProjectItem } from "./ProjectItem";

export class UpdatePackagesReferencesCommand implements Command {
    public readonly id = "update-packages-references";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly preferences: PreferencesService,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const project = await this.selectProject();
        if (!project) {
            this.logger.trace("Execution interrupted: Selection cancelled");
            return;
        }

        if (!project.path) {
            this.logger.trace("Execution interrupted: Path is null");
            return;
        }

        var allPackages = this.dotnet.getPackages(project.path, false);

        if (project.solution) {
            this.logger.trace("Solution select");
        }
        else {
            this.logger.trace("Project select");
        }

        //QuickPickUtils.executeWizzard
    }

    private async selectProject(): Promise<ProjectItem | undefined> {
        const solutions = await this.loadSolutions();
        const projects = await this.loadProjects(solutions);
        if (projects.length === 0) {
            return undefined;
        }

        const items: ProjectItem[] = [];
        if (solutions.length > 0) {
            items.push(new ProjectItem("solutions", undefined, false, true));
            items.push(...solutions.map(s => new ProjectItem(undefined, s, true, false)));
        }

        if (items.length > 0) {
            items.push(new ProjectItem("projects", undefined, false, true));
        }

        items.push(...projects.map(p => new ProjectItem(undefined, p, false, false)));

        return await QuickPickUtils.executeSelector<ProjectItem>(
            "Select project",
            "Start typing for filtering",
            items,
            undefined
        );
    }

    private async loadSolutions(): Promise<Path[]> {
        const activeSolution = this.preferences.getActiveSolution();
        if (activeSolution) {
            return [activeSolution];
        }

        return await this.dotnet.getSolutions();
    }

    private async loadProjects(solutions: Path[]): Promise<Path[]> {
        if (solutions.length === 1) {
            return await this.dotnet.getSolutionProjects(solutions[0]);
        }

        return await this.dotnet.getProjects();
    }
}