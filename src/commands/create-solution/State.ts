import { SlnFormat } from "@src/services/dotnet/SlnFormat";
import { Path } from "@src/tools/Path";

export interface State {
    value: string;
    format: SlnFormat;
    directory: Path;
    lockResolve: boolean;
}