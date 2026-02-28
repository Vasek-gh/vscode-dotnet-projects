import * as vscode from "vscode";
import { TemplateInfo } from "@src/services/dotnet/TemplateInfo";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";
import { PreferencesService } from "@src/services/preferences/PreferencesService";

class TemplateItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description: string;

    public constructor(
        public readonly template: TemplateInfo,
    ) {
        this.label = template.fullName;
        this.description = `${template.shortName}[${template.language}]`;
    }
}

export class TemplateSelector {
    private readonly preferences: PreferencesService;
    private readonly dotnetService: DotnetService;

    public constructor(
        preferences: PreferencesService,
        dotnetService: DotnetService
    ) {
        this.preferences = preferences;
        this.dotnetService = dotnetService;
    }

    public async execute(current: TemplateInfo | undefined): Promise<TemplateInfo | undefined> {
        const templates = await this.getTemplates(current);
        if (templates.length === 0) {
            return undefined;
        }

        return await QuickPickUtils.execute<TemplateItem, TemplateInfo>((quickPick, resolve) => {
            quickPick.title = "Select project type";
            quickPick.items = templates.map(t => new TemplateItem(t));

            return [
                quickPick.onDidHide(() => {
                    resolve(undefined);
                }),
                quickPick.onDidAccept(() => {
                    var result = quickPick.selectedItems[0].template;
                    this.preferences.pushTemplateToFavorites(result);
                    resolve(result);
                }),
            ];
        });
    }

    private async getTemplates(current: TemplateInfo | undefined): Promise<TemplateInfo[]> {
        const allTemplates = await this.dotnetService.getProjectTemplates();
        if (allTemplates.length === 0) {
            return [];
        }

        const favorites = this.preferences.getTemplateFavorites()
            .filter(f =>
                !f.isSame(current)
                && allTemplates.some(t => t.isSame(f))
            );

        const templates = allTemplates.filter(t =>
            !t.isSame(current)
            && !favorites.some(f => f.isSame(t))
        );

        const result: TemplateInfo[] = current === undefined ? [] : [current];
        result.push(...favorites);
        result.push(...templates);

        return result;
    }
}