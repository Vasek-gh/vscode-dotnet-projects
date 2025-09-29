import * as vscode from "vscode";
import { Path } from "@src/tools/Path";
import { State } from "./State";

export interface WizzardItem extends vscode.QuickPickItem {
    execute(state: State): Promise<Path | undefined>;
}