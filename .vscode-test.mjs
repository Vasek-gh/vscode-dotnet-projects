import { defineConfig } from '@vscode/test-cli';
import { fileURLToPath } from "url";
import { dirname } from "path";

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);
const fixedCwd = currentDir[0].toLowerCase() + currentDir.substring(1);

export default defineConfig({
    tests: [{
        files: "./out/tests/**/*.tests.js",
        srcDir: fixedCwd,
        workspaceFolder: "out/tests/project/project.code-workspace",
        launchArgs: [ "disable-hardware-acceleration" ]
    }],
    coverage: {
        includeAll: true,
        include: [
            `${fixedCwd}/out/src/**/*.js`,
        ],
        exclude: [
            // todo fix hardcoding
            `${fixedCwd}/out/src/services/FileSystemService.js`,
            `${fixedCwd}/out/src/tools/Extension.js`,
        ]
    }
});
