import { ActionResult } from "@src/tools/ActionResult";
import { Path } from "@src/tools/Path";

export interface ShellService {
    exec(command: string, cwd?: Path): Promise<ActionResult<string>>;
}