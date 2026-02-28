import * as vscode from "vscode";
import { SlnFormat } from "../dotnet/SlnFormat";
import { EntitiesKeys } from "@src/tools/EntitiesKeys";
import { TemplateInfo } from "../dotnet/TemplateInfo";
import { PreferencesService } from "./PreferencesService";
import { Path } from "@src/tools/Path";

export class DefaultPreferencesService implements PreferencesService {
    public constructor(
        private readonly context: vscode.ExtensionContext
    ) {
    }

    public getSolutionFormat(): SlnFormat {
        var lastSelectedFormat = this.getValue<string>(EntitiesKeys.solutionFormat);
        if (lastSelectedFormat === SlnFormat.slnx.extension) {
            return SlnFormat.slnx;
        }

        return SlnFormat.sln;
    }

    public setSolutionFormat(value: SlnFormat): void {
        this.setValue(EntitiesKeys.solutionFormat, value.extension);
    }

    public getActiveSolution(): Path | undefined {
        const value = this.getValue<string>(EntitiesKeys.activeSolution);
        return value === undefined
            ? undefined
            : Path.fromFile(vscode.Uri.file(value));
    }

    public setActiveSolution(value: Path | undefined): void {
        this.setValue(EntitiesKeys.activeSolution, value?.uri.fsPath);
    }

    public getAutoSolutionPrefix(): boolean {
        return this.getValue<boolean>(EntitiesKeys.autoSolutionPrefix)
            ?? true;
    }

    public setAutoSolutionPrefix(value: boolean): void {
        this.setValue(EntitiesKeys.autoSolutionPrefix, value);
    }

    public getTemplateFavorites(): TemplateInfo[] {
        const values = this.getValue<TemplateInfo[]>(EntitiesKeys.favoritesTemplates)
            ?? [];

        return values.map(v => new TemplateInfo(v.fullName, v.shortName, v.language));
    }

    public pushTemplateToFavorites(template: TemplateInfo): void {
        const items = this.getTemplateFavorites().filter(i =>
            !i.isSame(template)
        );

        items.unshift(template);

        this.setValue(EntitiesKeys.favoritesTemplates, items);
    }

    public getValue<T>(key: string): T | undefined {
        return this.context.workspaceState.get<T>(key);
    }

    public async setValue<T>(key: string, value: T | undefined): Promise<void> {
        await this.context.workspaceState.update(key, value);
    }
}