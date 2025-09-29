import * as vscode from "vscode";
import { FileSystemService } from "@src/services/file-system/FileSystemService";
import { Path } from "@src/tools/Path";
import { Logger } from "@src/tools/Logger";

class Errors {
    public static readonly fileNotFound = vscode.FileSystemError.FileNotFound("dummy");
}

export class DefaultFileSystemService implements FileSystemService {
    private readonly logger: Logger;

    public constructor(
        logger: Logger
    ) {
        this.logger = logger.create(this);
    }

    public async getPath(uri: vscode.Uri): Promise<Path> {
        const fileStat = await this.internalStat(uri);
        if (!fileStat) {
            throw vscode.FileSystemError.FileNotFound;
        }

        return new Path(uri, fileStat.type);
    }

    public getStat(path: Path): Promise<vscode.FileStat | undefined> {
        return this.internalStat(path.uri);
    }

    private async internalStat(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
        try {
            return await vscode.workspace.fs.stat(uri);
        }
        catch (e: any) {
            if (e instanceof vscode.FileSystemError && (e as vscode.FileSystemError).code === Errors.fileNotFound.code) {
                return undefined;
            }

            throw e;
        }
    }
}