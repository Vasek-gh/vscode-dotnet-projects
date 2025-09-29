import * as vscode from "vscode";
import { Path } from "@src/tools/Path";

export interface FileSystemService {
    /**
     * Create Path object from vscode.Uri.
     * If the path leads to a non-existent file or folder throw error.
     */
    getPath(uri: vscode.Uri): Promise<Path>;

    /**
     * Return path status.
     * If the path leads to a non-existent file or folder, return undefined.
     */
    getStat(path: Path): Promise<vscode.FileStat | undefined>;
}