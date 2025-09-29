import { FileSystemService } from "@src/services/file-system/FileSystemService";
import { SolutionSelector } from "./SolutionSelector";
import { DotnetService } from "@src/services/dotnet/DotnetService";
import { PreferencesService } from "@src/services/PreferencesService";
import { DirectorySelector } from "./DirectorySelector";

export class SelectorFactory {
    public constructor(
        public readonly dotnet: DotnetService,
        public readonly fileSystem: FileSystemService,
        public readonly preferences: PreferencesService
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