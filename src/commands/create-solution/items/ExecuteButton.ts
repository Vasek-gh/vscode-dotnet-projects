import { Path } from "@src/tools/Path";
import { State } from "./State";
import { SlnFormat } from "@src/services/dotnet/SlnFormat";
import { DotnetService } from "@src/services/dotnet/DotnetService";

export class ExecuteButton {
    public label: string;
    public readonly alwaysShow: boolean = true;

    public constructor(
        private readonly state: State,
        private readonly dotnetService: DotnetService
    ) {
        this.label = "Create soltion";
    }

    public async execute(): Promise<Path | undefined> {
        const [solutionName, format] = this.makeName();

        const commandResult = await this.dotnetService.createSolution(this.state.directory, solutionName, format);
        if (await commandResult.handleError("Create solution fail", true)) {
            return undefined;
        }

        return commandResult.data;
    }

    private makeName(): [string, SlnFormat] {
        const name = this.state.value === ""
            ? this.state.directory.getBaseName()
            : this.state.value;

        if (name.endsWith(SlnFormat.sln.extension)) {
            return [name.substring(0, name.length - SlnFormat.sln.extension.length), SlnFormat.sln];
        }

        if (name.endsWith(SlnFormat.slnx.extension)) {
            return [name.substring(0, name.length - SlnFormat.slnx.extension.length), SlnFormat.slnx];
        }

        return [name, this.state.format];
    }
}
