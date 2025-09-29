import { SlnFormat } from "@src/services/dotnet/SlnFormat";
import { QuickPickTool } from "@src/tools/QuickPickTool";
import * as vscode from "vscode";

class FormatItem implements vscode.QuickPickItem {
    public constructor(
        public readonly label: string,
        public readonly format: SlnFormat,
        public readonly description: string
    ) {
    }

    public getValue(): SlnFormat {
        return this.format;
    }
}

export class FormatSelector {
    public static readonly slnFormat: FormatItem = new FormatItem(SlnFormat.sln.title, SlnFormat.sln, "Solution file");
    public static readonly slnxFormat: FormatItem = new FormatItem(SlnFormat.slnx.title, SlnFormat.slnx, "XML-based solution file");

    public constructor(
    ) {
    }

    public getDefault(): SlnFormat {
        return SlnFormat.sln;
    }

    public async execute(current: SlnFormat | undefined): Promise<SlnFormat | undefined> {
        const items = [
            FormatSelector.slnFormat,
            FormatSelector.slnxFormat,
        ];

        const currentItem = items.find(i => i.format === current);

        return await QuickPickTool.execute(
            "Select solution directory",
            "Start typing for filtering",
            items,
            currentItem
        );
    }
}