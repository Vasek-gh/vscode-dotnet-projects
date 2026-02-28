import * as vscode from "vscode";
import { Logger } from "../tools/Logger";
import { Path } from "../tools/Path";
import { SelectorFactory } from "@src/selectors/SelectorFactory";
import { Command } from "./Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";

class ProjectItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description: string;

    public constructor(project: Path) {
        this.label = project.getBaseName(true);
        this.description = project.uri.fsPath;
    }
}

export class ShowSolutionCommand implements Command {
    public readonly id = "show-solution";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly selectorFactory: SelectorFactory,
    ) {
        logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const solution = await this.selectorFactory.createSolutionSelector().execute(undefined);
        if (!solution) {
            this.logger.trace("Execution interrupted: Solution not found");
            return;
        }

        // todo reveal?
        const p = await vscode.window.showQuickPick(
            this.getProjects(solution),
            {
                title: `${solution.getBaseName(false)} projects`
            }
        );
    }

    private async getProjects(solution: Path): Promise<ProjectItem[]> {
        const projects = await this.dotnet.getSolutionProjects(solution);

        return projects.map(p => new ProjectItem(p));
    }
}