import { FileSystemService } from "@src/services/file-system/FileSystemService";
import { SolutionSelector } from "./SolutionSelector";
import { DefaultPreferencesService } from "@src/services/preferences/DefaultPreferencesService";
import { DirectorySelector } from "./DirectorySelector";
import { DotnetService } from "@src/services/dotnet/DotnetService";

export class SelectorFactory {
    public constructor(
        public readonly dotnet: DotnetService,
        public readonly fileSystem: FileSystemService,
        public readonly preferences: DefaultPreferencesService
    ) {

    }

    public createDirectorySelector(): DirectorySelector {
        return new DirectorySelector();
    }

    public createSolutionSelector(): SolutionSelector {
        return new SolutionSelector(
            this.dotnet,
            this.fileSystem,
            this.preferences
        );
    }
}