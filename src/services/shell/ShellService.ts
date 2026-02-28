import { ActionResult } from "@src/tools/ActionResult";

export interface ShellService {
    exec(command: string, cwd?: string): Promise<ActionResult<string>>;
}