import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { State } from "./State";

export interface CreateProjectWizzardItem extends vscode.QuickPickItem {
    execute(state: State): Promise<Path | undefined>;
}