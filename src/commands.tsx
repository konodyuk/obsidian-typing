import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { HookNames, Type } from "src/typing";
import { ActionSuggestModal, Prompt, TypeSuggestModal } from "src/ui";

const COMMANDS = [
    {
        id: "typing-new",
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
        id: "typing-actions",
        name: "Open Actions",
        callback: () => {
            let note = gctx.currentNote;
            if (!note) return;
            new ActionSuggestModal(gctx.app, note).open();
        },
    },
];

export function registerCommands(plugin: TypingPlugin) {
    for (let command of COMMANDS) {
        plugin.addCommand(command);
    }
}
