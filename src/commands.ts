import { TFile } from "obsidian";
import { ctx } from "./context";
import TypingPlugin from "./main";
import { openActions } from "./modals/actions";
import { FieldSuggestModal, TypeSuggestModal } from "./modals/suggest";

const COMMANDS = [
    // {
    //     id: "typing-find",
    //     name: "Find",
    //     callback: () => {},
    // },

    {
        id: "typing-new",
        name: "New",
        callback: async () => {
            new TypeSuggestModal(ctx.app, async (type) => {
                let note = await type._new();
                ctx.app.workspace.activeLeaf.openFile(
                    ctx.app.vault.getAbstractFileByPath(note.path) as TFile
                );
            }).open();
        },
    },

    // {
    //     id: "typing-change-type",
    //     name: "Change Type",
    //     callback: () => {},
    // },

    {
        id: "typing-field",
        name: "Set Field",
        callback: async () => {
            let note = ctx.currentNote;
            if (note) {
                let fieldNames = Object.keys(note.type.fields);
                new FieldSuggestModal(
                    ctx.app,
                    fieldNames,
                    async (fieldName) => {
                        let newValue = await note.promptField(fieldName);
                        if (newValue != null) {
                            note.setField(fieldName, newValue);
                        }
                    }
                ).open();
            }
        },
    },

    {
        id: "typing-actions",
        name: "Open Actions",
        callback: () => {
            let note = ctx.currentNote;
            if (note) {
                openActions(note.path);
            }
        },
    },
];
export function registerCommands(plugin: TypingPlugin) {
    for (let command of COMMANDS) {
        plugin.addCommand(command);
    }
}
