import * as vscode from "vscode";
import { SlnFormat } from "@src/services/dotnet/SlnFormat";
import { QuickPickUtils } from "@src/tools/QuickPickUtils";
import { PreferencesService } from "@src/services/preferences/PreferencesService";

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
    public static readonly slnFormat: FormatItem = new FormatItem(
        SlnFormat.sln.title,
        SlnFormat.sln,
        "Solution file"
    );

    public static readonly slnxFormat: FormatItem = new FormatItem(
        SlnFormat.slnx.title,
        SlnFormat.slnx,
        "XML-based solution file"
    );

    public constructor(
        private readonly preferences: PreferencesService
    ) {
    }

    public getDefault(): SlnFormat {
        return this.preferences.getSolutionFormat();
    }

    public async execute(current: SlnFormat | undefined): Promise<SlnFormat | undefined> {
        const items = [
            FormatSelector.slnFormat,
            FormatSelector.slnxFormat,
        ];

        const currentItem = items.find(i => i.format === current);

        var result = await QuickPickUtils.executeSelector(
            "Select solution format",
            "Start typing for filtering",
            items,
            currentItem
        );

        if (result) {
            this.preferences.setSolutionFormat(result);
        }

        return result;
    }
}