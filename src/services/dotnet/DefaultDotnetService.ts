import * as vscode from "vscode";
import { Logger } from "@src/tools/Logger";
import { Path } from "@src/tools/Path";
import { TemplateInfo } from "./TemplateInfo";
import { ActionResult } from "@src/tools/ActionResult";
import { CacheService } from "../CacheService";
import { EntitiesKeys } from "../../tools/EntitiesKeys";
import { SlnFormat } from "./SlnFormat";
import { ShellService } from "../shell/ShellService";
import { DotnetService } from "./DotnetService";

export class DefaultDotnetService implements DotnetService {
    private readonly logger: Logger;
    private readonly shell: ShellService;
    private readonly cache: CacheService;

    public constructor(
        logger: Logger,
        shell: ShellService,
        cache: CacheService,
    ) {
        this.logger = logger.create(this);
        this.shell = shell;
        this.cache = cache;
    }

    public async getSolutions(): Promise<Path[]> {
        const files = (await vscode.workspace.findFiles("**/*.{sln,slnx}"))
            .map(f => Path.fromFile(f)) // todo slnx
            .sort((one, two) => (one.fullPath < two.fullPath ? -1 : 1));

        return files;
    }

    public async getProjects(basePath?: Path): Promise<Path[]> {
        const pattern = "**/*.*proj";

        const findResult = basePath === undefined
            ? await vscode.workspace.findFiles(pattern)
            : await vscode.workspace.findFiles(new vscode.RelativePattern(basePath.uri, pattern));

        const files = findResult
            .map(f => Path.fromFile(f))
            .sort((one, two) => (one.fullPath < two.fullPath ? -1 : 1));

        return files;
    }

    public async getSolutionProjects(solution: Path): Promise<Path[]> {
        const commandResult = await this.shell.exec(`dotnet sln "${solution.uri.fsPath}" list`);
        if (!commandResult.success() || !commandResult.data.startsWith("Project(s)")) {
            return [];
        }

        return commandResult.data.split("\n")
            .slice(2)
            .map(p => p.trim())
            .filter(p => p !== "")
            .map(p => {
                return solution.getDirectory().appendFile(p);
            });
    }

    public async getProjectReferences(project: Path): Promise<Path[]> {
        const commandResult = await this.shell.exec(`dotnet list "${project.uri.fsPath}" reference `);
        if (!commandResult.success() || !commandResult.data.startsWith("Project reference(s)")) {
            return [];
        }

        return commandResult.data.split("\n")
            .slice(2)
            .map(p => p.trim())
            .filter(p => p !== "")
            .map(p => {
                return project.getDirectory().appendFile(p);
            });
    }

    public async getProjectTemplates(): Promise<TemplateInfo[]> {
        return this.cache.get(EntitiesKeys.templates, async () => {
            const commandResult = await this.shell.exec("dotnet new list --type project");
            if (!commandResult.success()) {
                return [];
            }

            const table = this.parseTable(commandResult.data);

            const result: TemplateInfo[] = [];
            for (const row of table) {
                const languages = this.parseLanguage(row[2]);
                for (const language of languages) {
                    result.push(new TemplateInfo(
                        row[0],
                        row[1],
                        language
                    ));
                }
            }

            return result;
        });
    }

    public async createSolution(directory: Path, solutionName: string, format: SlnFormat): Promise<ActionResult<Path | undefined>> {
        const nameArg = solutionName.length === 0
            ? ""
            : `--name ${solutionName}`;

        const command = format === SlnFormat.sln
            ? `dotnet new sln ${nameArg} -f sln`
            : `dotnet new sln ${nameArg} -f slnx`;

        const commandResult = await this.shell.exec(command, directory.uri.fsPath);
        if (!commandResult.success()) {
            return new ActionResult<undefined>(
                commandResult.code,
                undefined,
                commandResult.error
            );
        }

        return new ActionResult<Path>(
            0,
            directory.appendFile(solutionName + format.extension),
            undefined
        );
    }

    public async createProject(template: TemplateInfo, directory: Path, projectName: string): Promise<ActionResult<Path | undefined>> {
        const command = `dotnet new ${template.shortName} --language ${template.language} --output ${projectName}`;
        const commandResult = await this.shell.exec(command, directory.uri.fsPath);
        if (!commandResult.success()) {
            return new ActionResult<undefined>(
                0,
                undefined,
                commandResult.error?.split("\n").slice(0, 2).join("\n")
            );
        }

        const pattern = new vscode.RelativePattern(directory.appendDir(projectName).uri, `${projectName}.*proj`);
        const [project] = (await vscode.workspace.findFiles(pattern))
            .map(f => Path.fromFile(f));

        return new ActionResult<Path>(
            0,
            project ?? directory.appendFile(projectName, projectName + ".proj"),
            undefined
        );
    }

    public async addProject(solution: Path, project: Path, inRoot: boolean): Promise<ActionResult<undefined>> {
        const inRootOpt = inRoot ? " --in-root" : "";
        const command = `dotnet sln "${solution.uri.fsPath}" add "${project.uri.fsPath}" ${inRootOpt}`;

        const commandResult = await this.shell.exec(command, solution.getDirectory().uri.fsPath);

        return new ActionResult<undefined>(
            0,
            undefined,
            commandResult.success() ? undefined : commandResult.error
        );
    }

    public async removeProject(solution: Path, project: Path): Promise<ActionResult<undefined>> {
        const command = `dotnet sln "${solution.uri.fsPath}" remove "${project.uri.fsPath}"`;

        const commandResult = await this.shell.exec(command, solution.getDirectory().uri.fsPath);

        return new ActionResult<undefined>(
            0,
            undefined,
            commandResult.success() ? undefined : commandResult.error
        );
    }

    public async addProjectReference(project: Path, references: Path[]): Promise<ActionResult<undefined>> {
        const referencesArgs = references.map(r => `"${r.uri.fsPath}"`).join(" ");
        const command = `dotnet add "${project.uri.fsPath}" reference ${referencesArgs}`;

        const commandResult = await this.shell.exec(command);

        return new ActionResult<undefined>(
            0,
            undefined,
            commandResult.success() ? undefined : commandResult.error
        );
    }

    public async removeProjectReference(project: Path, references: Path[]): Promise<ActionResult<undefined>> {
        const referencesArgs = references.map(r => `"${r.uri.fsPath}"`).join(" ");
        const command = `dotnet remove "${project.uri.fsPath}" reference ${referencesArgs}`;

        const commandResult = await this.shell.exec(command);

        return new ActionResult<undefined>(
            0,
            undefined,
            commandResult.success() ? undefined : commandResult.error
        );
    }

    private parseLanguage(value: string): string[] {
        return value.split(",")
            .map(i => i.trim().replace("[", "").replace("]", ""))
            .filter(i => i.length > 0);
    }

    private parseTable(list: string): string[][] {
        const table = list?.split("\n").slice(2).filter(r => r.trim() !== "");
        if (table === undefined) {
            return []; // todo throw
        }

        const colsLength = this.parseColsLength(table);

        return table.slice(2).map(l => {
            const result: string[] = [];

            let start = 0;
            for (const colLength of colsLength) {
                result.push(l.substring(start, start + colLength).trim());
                start += colLength;
            }

            return result;
        });
    }

    private parseColsLength(table: string[]): number[] {
        return table[1].trim().split("  ").map(s => s.length + 2);
    }
}