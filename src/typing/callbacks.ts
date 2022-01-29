import { TAbstractFile, TFile } from "obsidian";
import TypingPlugin from "src/main";
import { Note } from "./note";

function onCreateTypedNote(file: TAbstractFile) {
    setTimeout(() => {
        if (!(file as TFile).basename) {
            // not a TFile
            return;
        }
        let note = new Note(file.path);
        if (note.type?.prefix) {
            let prefix = note.type.prefix;
            if (!note.prefix) {
                note.rename(`${prefix.new(note.type)} ${note.name}`);
            }
        }

        // Setting the timeout slightly longer than the default autosave interval (2s).
        // Consider the following case:
        // 1. the note is created from kanban
        // 2. kanban's content is changed from NoteName to [[NoteName]]
        // 3. kanban's markdown content is saved in 2 seconds from previous step
        // If we change the name of the file between the steps 2 and 3, the link in kanban won't be updated,
        // since obsidian doesn't handle unsaved draft when autoupdating links.
    }, 3000);
}

export function registerOnCreateTypedNoteCallback(plugin: TypingPlugin) {
    plugin.registerEvent(plugin.app.vault.on("create", onCreateTypedNote));
}
