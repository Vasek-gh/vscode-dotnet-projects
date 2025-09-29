import * as cp from "child_process";
import { Logger } from "./Logger";
import { CommandResult } from "./CommandResult";

export class Shell {
    public constructor(
        private readonly logger: Logger
    ) {
        this.logger = logger.create(this);
    }

    public async exec(command: string, cwd?: string): Promise<CommandResult<string>> {
        try {
            this.logger.trace(`Execute at ${cwd}: ${command}`);

            const [error, out, err] = await new Promise<[cp.ExecFileException | null, string, string]>((resolve, reject) => {
                cp.exec(
                    command,
                    {
                        cwd: cwd,
                    },
                    (error, out, err) => {
                        return resolve([error, out, err]);
                    }
                );
            });

            if (error) {
                const code = typeof error.code === "string"
                    ? error.errno
                    : error.code;

                const message = typeof error.code === "string"
                    ? error.code
                    : error.message;

                this.logger.error(`Fail with code: ${code} output: ${message}`);

                return new CommandResult(
                    code ?? 0,
                    "",
                    message
                );
            }

            this.logger.trace(`Sucess:\n${out}`);

            return new CommandResult(
                0,
                out,
                undefined
            );
        }
        catch (e: any) {
            this.logger.exception(e);

            return new CommandResult(
                Number.MAX_SAFE_INTEGER,
                "",
                e.message
            );
        }
    }
}