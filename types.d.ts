import "obsidian";
import { DataviewApi } from "obsidian-dataview";

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
            plugins: {
                [id: string]: any;
                dataview?: {
                    api?: DataviewApi;
                };
            };
        };
    }
    interface MetadataCache {
        on(name: "typing:schema-change", callback: () => any, ctx?: any): EventRef;
        on(name: "typing:schema-ready", callback: () => any, ctx?: any): EventRef;
        on(name: "dataview:api-ready", callback: (api: DataviewPlugin["api"]) => any, ctx?: any): EventRef;
        on(
            name: "dataview:metadata-change",
            callback: (
                ...args:
                    | [op: "rename", file: TAbstractFile, oldPath: string]
                    | [op: "delete", file: TFile]
                    | [op: "update", file: TFile]
            ) => any,
            ctx?: any
        ): EventRef;
    }
}
