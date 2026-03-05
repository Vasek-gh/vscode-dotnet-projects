import { Path } from "@src/tools/Path";
import { Utils } from "@src/tools/Utils";
import * as vscode from "vscode";

export class ProjectItem implements vscode.QuickPickItem {
    public readonly label: string;
    public readonly description?: string;
    public readonly kind: vscode.QuickPickItemKind;
    public readonly iconPath: vscode.IconPath | undefined;
    public readonly resourceUri: vscode.Uri | undefined;

    public constructor(
        label: string | undefined,
        public readonly path: Path | undefined,
        public readonly solution: boolean,
        public readonly separator: boolean
    ) {
        this.label = path?.getBaseName(true) ?? label ?? "";
        this.description = path ? Utils.getPathCaption(path) : undefined;
        this.kind = separator ? vscode.QuickPickItemKind.Separator : vscode.QuickPickItemKind.Default;

        if (path) {
            this.iconPath = vscode.ThemeIcon.File;
            this.resourceUri = path.uri;
        }
    }

    public getValue(): ProjectItem {
        if (!this.path) {
            throw new Error("Invalid operation");
        }

        return this;
    }
}
