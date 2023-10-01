import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { HookNames, Type } from "src/typing";
import { ActionSuggestModal, Prompt, TypeSuggestModal } from "src/ui";

const COMMANDS = [
    {
        id: "new",
        name: "New",
        callback: async () => {
            let type = await new Promise<Type>((resolve, reject) => {
                let modal = new TypeSuggestModal(gctx.app, (type) => resolve(type));
                modal.open();
            });
            if (!type) {
                return;
            }
            if (type.hooks.has(HookNames.CREATE)) {
                type.runHook(HookNames.CREATE, { type });
                return;
            }
            let defaults: Record<string, string> = {};
            for (let fieldName in type.fields) {
                defaults[fieldName] = type.fields[fieldName].default;
            }
            let state = await gctx.api.prompt(
                <Prompt submitText={`Create new ${type.name}`} noteState={{ type, fields: defaults }}>
                    <Prompt.Title />
                    <Prompt.Text />
                    <Prompt.Fields />
                </Prompt>,
                { confirmation: true }
            );
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
