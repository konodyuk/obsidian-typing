import { Editor } from "obsidian";
import {
    SearchNoteSuggestModal,
    SearchNoteListSuggestModal,
    StringSuggestModal,
} from "./search";
import { TypeRegistry, Type } from "./type";

export interface FieldSearchResult {
    success: boolean;
    lineno?: number;
    match?: RegExpExecArray;
}

export class Field {
    regexThisField = RegExp(`^\\s*${this.name}\\s*::\\s*(?<value>.*)`);
    regexAnyField = RegExp(
        `^\\s*(?<field>[0-9\\w\\p{Letter}][-0-9\\w\\p{Letter}]*)\\s*::\\s*(?<value>.*)`
    );
    constructor(
        public registry: TypeRegistry,
        public name: string,
        public kind?: "any" | "link" | "list" | "choice",
        public typeNames?: "any" | Array<string>,
        public options?: Array<string>
    ) {
        if (!this.kind) {
            this.kind = "any";
        }
        if (!this.typeNames) {
            this.typeNames = "any";
        }
        if (!this.options) {
            this.options = [];
        }
        for (let i = 0; i < this.options.length; i++) {
            this.options[i] = String(this.options[i]);
        }
    }
    locateField(editor: Editor): FieldSearchResult {
        let match;
        for (let lineno = 0; lineno < editor.lineCount(); lineno++) {
            let line = editor.getLine(lineno);
            if ((match = this.regexThisField.exec(line))) {
                return { success: true, lineno: lineno, match: match };
            }
        }
        return { success: false };
    }
    getValue(editor: Editor): string {
        let result = this.locateField(editor);
        if (result.success) {
            return result.match.groups.value;
        }
        return "";
    }
    setValue(
        editor: Editor,
        value: string,
        type: Type,
        setCursor: boolean = false
    ) {
        let result = this.locateField(editor);
        let newLine = `${this.name} :: ${value}`;
        if (result.success) {
            let line = editor.getLine(result.lineno);
            editor.replaceRange(
                newLine,
                {
                    line: result.lineno,
                    ch: 0,
                },
                {
                    line: result.lineno,
                    ch: line.length,
                }
            );
            if (setCursor) {
                editor.setSelection(
                    {
                        line: result.lineno,
                        ch: this.name.length + 4,
                    },
                    {
                        line: result.lineno,
                        ch: editor.getLine(result.lineno).length,
                    }
                );
            }
        } else {
            let lineno = 0;
            // skip frontmatter
            if (editor.getLine(0).trim() === "---") {
                lineno = 1;
                while (
                    lineno < editor.lineCount() &&
                    editor.getLine(lineno).trim() !== "---"
                ) {
                    lineno++;
                }
                if (lineno == editor.lineCount()) {
                    lineno = 1;
                } else {
                    lineno++;
                }
            }
            // skip blank lines
            while (
                lineno < editor.lineCount() &&
                !editor.getLine(lineno).trim().length
            ) {
                lineno++;
            }
            // skip preceding fields
            let fieldOrder = type.getFieldOrder();
            let currentFieldOrder = fieldOrder[this.name];
            for (; lineno < editor.lineCount(); lineno++) {
                let line = editor.getLine(lineno);
                let match = this.regexAnyField.exec(line);
                if (!match) {
                    break;
                }
                let order = fieldOrder[match.groups.field];
                if (order > currentFieldOrder) {
                    break;
                }
            }
            editor.replaceRange(newLine + "\n", {
                line: lineno,
                ch: 0,
            });
            if (setCursor) {
                editor.setCursor({
                    line: lineno,
                    ch: editor.getLine(lineno).length,
                });
            }
        }
    }
    async suggestOptions(
        editor: Editor,
        oldValue: string,
        callback: { (newValue: string, setCursor?: boolean): void }
    ) {
        oldValue = oldValue.trim();
        if (this.kind == "any") {
            callback(oldValue, true);
        }
        if (this.kind == "choice") {
            new StringSuggestModal(
                this.registry.plugin.app,
                this.options,
                (s) => {
                    callback(s);
                }
            ).open();
        }
        if (this.kind == "link") {
            new SearchNoteSuggestModal(
                this.registry.plugin.app,
                this.registry.plugin,
                await this.registry.plugin.dataviewApi(),
                this.types,
                (page) => {
                    // TODO: check if unique and generate shortest link
                    // resolve(page.file.link.markdown());
                    callback(`[[${page.file.name}]]`);
                }
            ).open();
        }
        if (this.kind == "list") {
            new SearchNoteListSuggestModal(
                this.registry.plugin.app,
                this.registry.plugin,
                await this.registry.plugin.dataviewApi(),
                this.types,
                (pages) => {
                    let links = [];
                    if (oldValue) {
                        links.push(oldValue);
                    }
                    for (let page of pages) {
                        links.push(`[[${page.file.name}]]`);
                    }
                    callback(links.join(", "));
                }
            ).open();
        }
    }
    get types(): Array<Type> {
        let result: Array<Type> = [];
        if (!this.typeNames) {
            return result;
        }
        if (this.typeNames === "any") {
            return this.registry.typesList;
        }
        for (let typeName of this.typeNames) {
            result.push(this.registry.types[typeName]);
        }
        return result;
    }
}
