import { Path } from "./Path";

// todo kill
export interface Extension {
    id: string;
    name: string;
    version: string;
    extensionDir: Path;
}
