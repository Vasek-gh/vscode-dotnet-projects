import { TemplateInfo } from "@src/services/dotnet/TemplateInfo";
import { Path } from "@src/tools/Path";

export interface State {
    value: string;
    solution: Path | undefined;
    directory: Path;
    template: TemplateInfo;
    autoSolutionPrefix: boolean;
    lockResolve: boolean;
}