import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { Logger } from "@src/tools/Logger";
import { SolutionSelector } from "../../selectors/SolutionSelector";
import { TemplateSelector } from "./selectors/TemplateSelector";
import { State } from "./items/State";
import { SetSolutionItem } from "./items/SetSolutionItem";
import { ExecuteButton } from "./items/CreateProjectButton";
import { SetTemplateItem } from "./items/SetTemplateItem";
import { ProjectDirectorySelector } from "./selectors/ProjectDirectorySelector";
import { SetDirectoryItem } from "./items/SetDirectoryItem";
import { SetAutoSolutionPrefixItem } from "./items/SetAutoSolutionPrefixItem";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";
import { SetCreateProjectFolderItem } from "./items/SetCreateProjectFolderItem";
import { TemplateInfo } from "@src/services/dotnet/TemplateInfo";
import { SetCreateSolutionItem } from "./items/SetCreateSolutionItem";
import { PreferencesService } from "@src/services/preferences/PreferencesService";

export class CreateProjectWizzard {
    private readonly logger: Logger;
    private readonly dotnet: DotnetService;
    private readonly solutionSelector: SolutionSelector;
    private readonly templateSelector: TemplateSelector;
    private readonly directorySelector: ProjectDirectorySelector;
    private readonly preferences: PreferencesService;

    public constructor(
        logger: Logger,
        preferences: PreferencesService,
        dotnet: DotnetService,
        solutionSelector: SolutionSelector,
        templateSelector: TemplateSelector,
        directorySelector: ProjectDirectorySelector,
    ) {
        this.logger = logger.create(this);
        this.preferences = preferences;
        this.dotnet = dotnet;
        this.solutionSelector = solutionSelector;
        this.templateSelector = templateSelector;
        this.directorySelector = directorySelector;
    }

    public async show(): Promise<Path | undefined> {
        let state = await this.prepareState();
        if (state === undefined) {
            return undefined;
        }

        const items = this.prepareItems(state);

        return await QuickPickUtils.executeWizzard<State, Path>(
            this.logger,
            "Create project or change settings",
            "Enter new project name",
            state,
            items
        );
    }

    private async prepareState(): Promise<State | undefined> {
        const template = await this.templateSelector.execute(undefined);
        if (!template) {
            return undefined;
        }

        return (await this.dotnet.getSolutions()).length > 0
            ? this.prepareStateBySolution(template)
            : this.prepareStateByDirectory(template);
    }

    private async prepareStateByDirectory(template: TemplateInfo): Promise<State | undefined> {
        const directory = await this.directorySelector.execute(undefined, undefined);
        if (!directory) {
            return undefined;
        }

        return {
            value: "",
            solution: undefined,
            directory: directory,
            template: template,
            autoSolutionPrefix: false,
            createProjectFolder: true,
            createSolution: true,
            lockHide: false
        };
    }

    private async prepareStateBySolution(template: TemplateInfo): Promise<State | undefined> {
        const solution = await this.solutionSelector.execute(undefined);
        if (!solution) {
            return undefined;
        }

        return {
            value: "",
            solution: solution,
            directory: await this.directorySelector.getSolutionDefaultDir(solution),
            template: template,
            autoSolutionPrefix: this.preferences.getAutoSolutionPrefix(),
            createProjectFolder: true,
            createSolution: undefined,
            lockHide: false
        };
    }

    private prepareItems(state: State): vscode.QuickPickItem[] {
        const directoryItem = this.createDirectoryItem(state);

        const result: vscode.QuickPickItem[] = [
            this.createExecuteButton(state),
            {
                label: "Settings",
                kind: vscode.QuickPickItemKind.Separator,
                alwaysShow: true,
            },
            directoryItem,

        ];

        if (state.solution !== undefined) {
            result.push(this.createSolutionItem(state, directoryItem));
        }

        result.push(this.createTemplateItem(state));

        if (state.solution !== undefined) {
            result.push(this.createAutoSolutionPrefixItem(state));
        }
        else {
            result.push(this.createSetCreateSolutionItem(state));
        }

        result.push(this.createCreateProjectFolderItem(state));

        return result;
    }

    private createExecuteButton(state: State): ExecuteButton {
        return new ExecuteButton(
            state,
            this.preferences,
            this.dotnet
        );
    }

    private createDirectoryItem(state: State): SetDirectoryItem {
        return new SetDirectoryItem(
            state,
            this.directorySelector,
        );
    }

    private createSolutionItem(state: State, directoryItem: SetDirectoryItem): SetSolutionItem {
        return new SetSolutionItem(
            state,
            directoryItem,
            this.solutionSelector
        );
    }

    private createTemplateItem(state: State): SetTemplateItem {
        return new SetTemplateItem(
            state,
            this.templateSelector,
        );
    }

    private createAutoSolutionPrefixItem(state: State): SetAutoSolutionPrefixItem {
        return new SetAutoSolutionPrefixItem(
            state
        );
    }

    private createCreateProjectFolderItem(state: State): SetCreateProjectFolderItem {
        return new SetCreateProjectFolderItem(
            state
        );
    }

    private createSetCreateSolutionItem(state: State): SetCreateSolutionItem {
        return new SetCreateSolutionItem(
            state
        );
    }
}