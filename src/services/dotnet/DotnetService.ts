import { Path } from "@src/tools/Path";
import { TemplateInfo } from "./TemplateInfo";
import { SlnFormat } from "./SlnFormat";
import { ActionResult } from "@src/tools/ActionResult";
import { PackageInfo } from "./PackageInfo";

export interface DotnetService {
    getSolutions(): Promise<Path[]>;
    getProjects(basePath?: Path): Promise<Path[]>;

    getSolutionProjects(solution: Path): Promise<Path[]>;
    getProjectReferences(project: Path): Promise<Path[]>;

    getProjectTemplates(): Promise<TemplateInfo[]>;

    getPackages(project: Path, outdated: boolean): Promise<ActionResult<PackageInfo[]>>;

    createSolution(directory: Path, solutionName: string, format: SlnFormat): Promise<ActionResult<Path | undefined>>;
    createProject(template: TemplateInfo, directory: Path, projectName: string): Promise<ActionResult<Path | undefined>>;

    addProject(solution: Path, project: Path, inRoot: boolean): Promise<ActionResult<undefined>>;
    removeProject(solution: Path, project: Path): Promise<ActionResult<undefined>>;

    addProjectReference(project: Path, references: Path[]): Promise<ActionResult<undefined>>;
    removeProjectReference(project: Path, references: Path[]): Promise<ActionResult<undefined>>;
}