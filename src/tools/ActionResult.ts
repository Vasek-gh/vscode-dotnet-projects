import * as vscode from "vscode";

export class ActionResult<T> {
    public constructor(
        public readonly code: number,
        public readonly data: T,
        public readonly error: string | undefined,
    ) {
    }

    public success(): boolean {
        return this.code === 0 && this.error === undefined;
    }

    public static createSuccess<T>(data: T): ActionResult<T> {
        return new ActionResult<T>(
            0,
            data,
            undefined
        );
    }

    public recreateError<TData>(data: TData): ActionResult<TData> {
        return new ActionResult<TData>(
            this.code,
            data,
            this.error
        );
    }

    public async handleError(title: string, modal: boolean): Promise<boolean> {
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