import { Path } from "@src/tools/Path";
import { SlnFormat } from "../dotnet/SlnFormat";
import { TemplateInfo } from "../dotnet/TemplateInfo";

export interface PreferencesService {
    getSolutionFormat(): SlnFormat;
    setSolutionFormat(value: SlnFormat): void;

    getActiveSolution(): Path | undefined;
    setActiveSolution(value: Path | undefined): void;

    getAutoSolutionPrefix(): boolean;
    setAutoSolutionPrefix(value: boolean): void;

    getTemplateFavorites(): TemplateInfo[];
    pushTemplateToFavorites(template: TemplateInfo): void;
}