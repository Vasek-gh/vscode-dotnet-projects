import { TemplateInfo } from "@src/services/dotnet/TemplateInfo";
import { PreferencesService } from "@src/services/PreferencesService";
import { EntitiesKeys } from "@src/tools/EntitiesKeys";

export class Preferences {
    public constructor(
        private readonly preferences: PreferencesService
    ) {
    }

    public getAutoSolutionPrefix(): boolean {
        return this.preferences.getValue<boolean>(EntitiesKeys.autoSolutionPrefix)
            ?? true;
    }

    public setAutoSolutionPrefix(value: boolean): void {
        this.preferences.setValue(EntitiesKeys.autoSolutionPrefix, value);
    }


    public getTemplateFavorites(): TemplateInfo[] {
        const values = this.preferences.getValue<TemplateInfo[]>(EntitiesKeys.favoritesTemplates)
            ?? [];

        return values.map(v => new TemplateInfo(v.fullName, v.shortName, v.language));
    }

    public pushTemplateToFavorites(template: TemplateInfo): void {
        const items = this.getTemplateFavorites().filter(i =>
            !i.isSame(template)
        );

        items.unshift(template);

        this.preferences.setValue(EntitiesKeys.favoritesTemplates, items);
    }
}