import * as vscode from "vscode";
import { Logger } from "../../tools/Logger";
import { CreateSolutionWizzard } from "./CreateSolutionWizzard";
import { FormatSelector } from "./selectors/FormatSelector";
import { DirectorySelector } from "@src/selectors/DirectorySelector";
import { Command } from "../Command";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { DefaultPreferencesService } from "@src/services/preferences/DefaultPreferencesService";

export class CreateSolutionCommand implements Command {
    public readonly id = "create-solution";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
        private readonly preferences: DefaultPreferencesService,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const wizzard = new CreateSolutionWizzard(
            this.logger,
            this.dotnet,
            new FormatSelector(this.preferences),
            new DirectorySelector(),
        );

        const solution = await wizzard.show();
        if (solution) {
            await vscode.commands.executeCommand("revealInExplorer", solution.uri);
        }
    }
}