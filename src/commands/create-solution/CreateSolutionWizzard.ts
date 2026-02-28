import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { Logger } from "@src/tools/Logger";
import { DirectorySelector } from "@src/selectors/DirectorySelector";
import { FormatSelector } from "./selectors/FormatSelector";
import { SetDirectoryItem } from "./items/SetDirectoryItem";
import { State } from "./items/State";
import { SetFormatItem } from "./items/SetFormatItem";
import { ExecuteButton } from "./items/ExecuteButton";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";

export class CreateSolutionWizzard {
    private readonly logger: Logger;
    private readonly dotnetService: DotnetService;
    private readonly formatSelector: FormatSelector;
    private readonly directorySelector: DirectorySelector;

    public constructor(
        logger: Logger,
        dotnetService: DotnetService,
        formatSelector: FormatSelector,
        directorySelector: DirectorySelector,
    ) {
        this.logger = logger.create(this);
        this.dotnetService = dotnetService;
        this.formatSelector = formatSelector;
        this.directorySelector = directorySelector;
    }

    public async show(): Promise<Path | undefined> {
        const directory = await this.directorySelector.execute(undefined);
        if (!directory) {
            return undefined;
        }

        let state = {
            value: "",
            directory: directory,
            format: this.formatSelector.getDefault(),
            lockHide: false
        };

        const items = [
            this.createExecuteButton(state),
            {
                label: "Settings",
                kind: vscode.QuickPickItemKind.Separator,
                alwaysShow: true,
            },
            this.createDirectoryItem(state),
            this.createFormatItem(state)
        ];

        return await QuickPickUtils.executeWizzard<State, Path>(
            this.logger,
            "Create solution",
            "Enter new solution name",
            state,
            items
        );
    }

    private createExecuteButton(state: State): ExecuteButton {
        return new ExecuteButton(
            state,
            this.dotnetService
        );
    }

    private createDirectoryItem(state: State): SetDirectoryItem {
        return new SetDirectoryItem(
            state,
            this.directorySelector,
        );
    }

    private createFormatItem(state: State): SetFormatItem {
        return new SetFormatItem(
            state,
            this.formatSelector,
        );
    }
}