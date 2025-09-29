import * as vscode from "vscode";
import { Logger } from "../../tools/Logger";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { CreateProjectWizzard as CreateProjectWizzard } from "./CreateProjectWizzard";
import { TemplateSelector } from "./selectors/TemplateSelector";
import { ProjectDirectorySelector } from "./selectors/ProjectDirectorySelector";
import { PreferencesService } from "@src/services/PreferencesService";
import { Preferences } from "./Preferences";
import { SelectorFactory } from "@src/selectors/SelectorFactory";
import { Command } from "../Command";

export class CreateProjectCommand implements Command {
    public readonly id = "create-project";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly preferences: PreferencesService,
        private readonly selectorFactory: SelectorFactory,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const wizzardPreferences = new Preferences(this.preferences);

        const wizzard = new CreateProjectWizzard(
            this.logger,
            wizzardPreferences,
            this.dotnet,
            this.selectorFactory.createSolutionSelector(),
            new TemplateSelector(wizzardPreferences, this.dotnet),
            new ProjectDirectorySelector(this.dotnet, this.selectorFactory.createDirectorySelector())
        );

        const project = await wizzard.show();
        if (project) {
            await vscode.commands.executeCommand("revealInExplorer", project.uri);
        }
    }
}