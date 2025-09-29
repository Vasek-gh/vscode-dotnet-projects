import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { Extension } from "@src/tools/Extension";

export class Config {
    private root: vscode.WorkspaceConfiguration;

    public constructor(
        private readonly extension: Extension
    ) {
        this.root = vscode.workspace.getConfiguration();

        this.reload();
    }

    // todo cache + onDidChangeConfiguration
    public reload(path?: Path): void {
        this.root = path
            ? vscode.workspace.getConfiguration(this.extension.name, path.uri)
            : vscode.workspace.getConfiguration(this.extension.name);
    }

    public get<T>(section: string): T | undefined {
        return this.root.get<T>(section);
    }
}