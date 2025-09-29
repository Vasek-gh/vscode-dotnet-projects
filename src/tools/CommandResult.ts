import * as vscode from "vscode";

export class CommandResult<T> {
    public constructor(
        public readonly code: number,
        public readonly data: T,
        public readonly error: string | undefined,
    ) {
    }

    public success(): boolean {
        return this.code === 0 && this.error === undefined;
    }

    public async showError(title: string, modal: boolean): Promise<boolean> {
        const success = this.success();
        if (!success) {
            const message = (this.code === 0 ? "" : `Code: ${this.code}\nError: `) + this.error;

            if (!modal) {
                vscode.window.showErrorMessage(
                    `${title}.\n${message}`
                );
            }
            else {
                await vscode.window.showErrorMessage(
                    title,
                    {
                        modal: true,
                        detail: message
                    }
                );
            }
        }

        return !success;
    }
}