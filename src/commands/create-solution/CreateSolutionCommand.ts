import * as vscode from "vscode";
import { Logger } from "../../tools/Logger";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { Wizzard } from "./Wizzard";
import { FormatSelector } from "./selectors/FormatSelector";
import { DirectorySelector } from "@src/selectors/DirectorySelector";
import { Command } from "../Command";

export class CreateSolutionCommand implements Command {
    public readonly id = "create-solution";

    public constructor(
        private readonly logger: Logger,
        private readonly dotnet: DotnetService,
    ) {
        this.logger = logger.create(this);
    }

    public async execute(): Promise<void> {
        this.logger.trace("Execute");

        const wizzard = new Wizzard(
            this.logger,
            this.dotnet,
            new FormatSelector(),
            new DirectorySelector(),
        );

        const solution = await wizzard.show();
        if (solution) {
            await vscode.commands.executeCommand("revealInExplorer", solution.uri);
        }
    }
}