import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { ActionSuggestModal } from "src/ui";

const COMMANDS = [
    {
        id: "new",
        name: "New",
        callback: async () => {
            let type = await gctx.api.promptType();
            if (!type) {
                return;
            }
            let state = type.promptNew();
            if (state) {
                await type.create(state);
            }
        },
    },

    {
        id: "actions",
        name: "Open Actions",
        callback: () => {
            let note = gctx.currentNote;
            if (!note) return;
            new ActionSuggestModal(gctx.app, note).open();
        },
    },

    {
        id: "create-otl-file",
        name: "Create new .OTL file",
        callback: async () => {
            let freeName;
            let extension = "otl";
            let suffix = "";
            let serial = 0;
            do {
                if (serial > 0) suffix = ` ${serial}`;
                freeName = `Untitled${suffix}.${extension}`;
                serial += 1;
            } while (gctx.app.vault.getAbstractFileByPath(freeName) != null);

            let tfile = await gctx.app.vault.create(freeName, "");
            gctx.app.workspace.getLeaf(false).openFile(tfile);
        },
    },

    {
        id: "create-root-schema",
        name: "Create root schema",
        callback: async () => {
            let schemaPath = gctx.settings.schemaPath;
            if (gctx.app.vault.getAbstractFileByPath(schemaPath) == null) {
                let tfile = await gctx.app.vault.create(schemaPath, "");
                gctx.app.workspace.getLeaf(false).openFile(tfile);
            }
        },
    },
];

export function registerCommands(plugin: TypingPlugin) {
    for (let command of COMMANDS) {
        plugin.addCommand(command);
    }
}
