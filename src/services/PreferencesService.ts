import * as vscode from "vscode";

export class PreferencesService {
    public constructor(
        private readonly context: vscode.ExtensionContext
    ) {
    }

    public getValue<T>(key: string): T | undefined {
        return this.context.workspaceState.get<T>(key);
    }

    public async setValue<T>(key: string, value: T | undefined): Promise<void> {
        await this.context.workspaceState.update(key, value);
    }
}