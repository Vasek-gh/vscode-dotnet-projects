import { Path } from "@src/tools/Path";
import { State } from "./State";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { WizzardItem } from "./WizzardItem";
import { SlnFormat } from "@src/services/dotnet/SlnFormat";

export class CreateSolutionButton implements WizzardItem {
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
        if (await commandResult.showError("Create solution fail", true)) {
            return undefined;
        }

        return this.state.directory.appendFile(`${solutionName}${format.extension}`);
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
