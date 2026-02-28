import * as vscode from "vscode";
import { DefaultFileSystemService } from "./services/file-system/DefaultFileSystemService";
import { Logger } from "./tools/Logger";
import { Utils } from "./tools/Utils";
import { Config } from "./configuration/Config";
import { Extension } from "./tools/Extension";
import { Path } from "./tools/Path";
import { DefaultDotnetService } from "./services/dotnet/DefaultDotnetService";
import { CreateSolutionCommand } from "./commands/create-solution/CreateSolutionCommand";
import { AddProjectCommand } from "./commands/AddProjectCommand";
import { CreateProjectCommand } from "./commands/create-project/CreateProjectCommand";
import { CacheService } from "./services/CacheService";
import { DefaultShellService } from "./services/shell/DefaultShellService";
import { SelectSolutionCommand } from "./commands/SelectSolutionCommand";
import { DefaultPreferencesService } from "./services/preferences/DefaultPreferencesService";
import { ShowSolutionCommand } from "./commands/ShowSolutionCommand";
import { RemoveProjectCommand } from "./commands/RemoveProjectCommand";
import { AddProjectReferenceCommand } from "./commands/AddProjectReferencesCommand";
import { RemoveProjectReferencesCommand } from "./commands/RemoveProjectReferencesCommand";
import { SelectorFactory } from "./selectors/SelectorFactory";
import { Command } from "./commands/Command";
import { DotnetService } from "./services/dotnet/DotnetService";
import { ShellService } from "./services/shell/ShellService";

/**
 * Entry point of this extension
*/
class Host implements Extension, vscode.Disposable {
    private readonly logger: Logger;
    private readonly disposables: vscode.Disposable[] = [];

    public readonly id: string;
    public readonly name: string;
    public readonly version: string;
    public readonly context: vscode.ExtensionContext;
    public readonly extensionDir: Path;

    public constructor(
        context: vscode.ExtensionContext,
    ) {
        this.id = context.extension.id;
        this.name = context.extension.packageJSON.name;
        this.version = context.extension.packageJSON.version;
        this.context = context;
        this.extensionDir = Path.fromDir(context.extension.extensionUri);

        this.logger = this.createLogger();

        try {
            this.logger.info("Initializing...");
            this.logger.info(`Version: ${this.version}`);

            const config = new Config(this);

            const cache = this.registerObject(new CacheService(this.logger));
            const shell = this.registerObject(new DefaultShellService(this.logger));
            const dotnet = this.registerObject(new DefaultDotnetService(this.logger, shell, cache));
            const fileSystem = this.registerObject(new DefaultFileSystemService(this.logger));
            const preferences = this.registerObject(new DefaultPreferencesService(context));
            const selectorFactory = this.registerObject(new SelectorFactory(dotnet, fileSystem, preferences));

            this.registerCommand(new CreateSolutionCommand(this.logger, dotnet, preferences));
            this.registerCommand(new SelectSolutionCommand(this.logger, dotnet, preferences));
            this.registerCommand(new ShowSolutionCommand(this.logger, dotnet, selectorFactory));

            this.registerCommand(new CreateProjectCommand(this.logger, dotnet, preferences, selectorFactory));
            this.registerCommand(new AddProjectCommand(this.logger, dotnet, selectorFactory));
            this.registerCommand(new RemoveProjectCommand(this.logger, dotnet, selectorFactory));

            this.registerCommand(new AddProjectReferenceCommand(this.logger, dotnet));
            this.registerCommand(new RemoveProjectReferencesCommand(this.logger, dotnet));

            this.logger.info("Initialization complete");
        }
        catch (e) {
            this.logger.exception(e, "Initialization fail");
            throw e;
        }
    }

    public dispose(): void {
        for (var disposable of this.disposables) {
            disposable.dispose();
        }

        this.logger.trace("Disposed");
    }

    private createLogger(): Logger {
        const loggerChannel = vscode.window.createOutputChannel(this.name, { log: true });

        this.disposables.push(loggerChannel);

        return new Logger(Utils.getTypeName(this), loggerChannel);
    }

    private registerObject<TService>(object: TService): TService {
        var disposable = object as vscode.Disposable;
        if (disposable) {
            this.disposables.push(disposable);
        }

        return object;
    }

    private registerCommand(command: Command): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(`${this.name}.${command.id}`, async () => {
                await command.execute();
            })
        );
    }
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(new Host(context));
}