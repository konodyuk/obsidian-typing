import { Editor, MarkdownView, TFile } from "obsidian";
import TypingPlugin from "./main";
import { Note } from "./typing/note";
import { Type } from "./typing/type";

let regexField = RegExp(
    `^\\s*(?<field>[0-9\\w\\p{Letter}][-0-9\\w\\p{Letter}]*)\\s*::\\s*(?<value>.*)\\s*`
);

export interface FieldSearchResult {
    success: boolean;
    lineno?: number;
    match?: RegExpExecArray;
}

interface IFieldAccessor {
    getValue(key: string): Promise<string | null>;
    setValue(key: string, value: string): void;
}

export class EditorFieldAccessor implements IFieldAccessor {
    constructor(public editor: Editor, public note: Note) {}
    locateField(key: string): FieldSearchResult {
        let match;
        for (let lineno = 0; lineno < this.editor.lineCount(); lineno++) {
            let line = this.editor.getLine(lineno);
            if ((match = regexField.exec(line)) && match.groups.field == key) {
                return { success: true, lineno: lineno, match: match };
            }
        }
        return { success: false };
    }
    async getValue(key: string): Promise<string | null> {
        let result = this.locateField(key);
        if (result.success) {
            return result.match.groups.value;
        }
        return null;
    }
    setValue(key: string, value: string): void {
        let result = this.locateField(key);
        let newLine = `${key} :: ${value}`;
        if (!value) {
            newLine = "";
        }
        if (result.success) {
            let line = this.editor.getLine(result.lineno);
            this.editor.replaceRange(
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
            // if (setCursor) {
            //     editor.setSelection(
            //         {
            //             line: result.lineno,
            //             ch: this.name.length + 4,
            //         },
            //         {
            //             line: result.lineno,
            //             ch: editor.getLine(result.lineno).length,
            //         }
            //     );
            // }
        } else {
            if (!newLine) {
                return;
            }
            let lineno = 0;
            // skip frontmatter
            if (this.editor.getLine(0).trim() === "---") {
                lineno = 1;
                while (
                    lineno < this.editor.lineCount() &&
                    this.editor.getLine(lineno).trim() !== "---"
                ) {
                    lineno++;
                }
                if (lineno == this.editor.lineCount()) {
                    // first line after leading "---", since it is unpaired
                    lineno = 1;
                } else {
                    // next line after second "---"
                    lineno++;
                }
            }
            let firstLineAfterFrontmatter = lineno;
            // skip blank lines
            while (
                lineno < this.editor.lineCount() &&
                !this.editor.getLine(lineno).trim().length
            ) {
                lineno++;
            }
            if (lineno == this.editor.lineCount()) {
                // the document is empty or contains only frontmatter
                lineno = firstLineAfterFrontmatter;
            } else {
                // skip preceding fields
                let fieldOrder = getFieldOrder(this.note.type);
                let currentFieldOrder = fieldOrder[key];
                for (; lineno < this.editor.lineCount(); lineno++) {
                    let line = this.editor.getLine(lineno);
                    let match = regexField.exec(line);
                    if (!match) {
                        break;
                    }
                    let order = fieldOrder[match.groups.field];
                    if (order > currentFieldOrder) {
                        break;
                    }
                }
            }
            this.editor.replaceRange(newLine + "\n", {
                line: lineno,
                ch: 0,
            });
            // if (setCursor) {
            //     editor.setCursor({
            //         line: lineno,
            //         ch: editor.getLine(lineno).length,
            //     });
            // }
        }
    }
}

export class PreviewFieldAccessor implements IFieldAccessor {
    content: string;
    lines: Array<string>;
    constructor(
        public file: TFile,
        public plugin: TypingPlugin,
        public note: Note
    ) {}
    async getLines(): Promise<Array<string>> {
        if (this.lines) {
            return this.lines;
        }
        this.content = await this.plugin.app.vault.read(this.file);
        this.lines = this.content.split("\n");
        return this.lines;
    }
    async locateField(key: string): Promise<FieldSearchResult> {
        let lines = await this.getLines();
        let match;
        for (let lineno = 0; lineno < lines.length; lineno++) {
            let line = lines[lineno];
            if ((match = regexField.exec(line)) && match.groups.field == key) {
                return { success: true, lineno: lineno, match: match };
            }
        }
        return { success: false };
    }
    async getValue(key: string): Promise<string> {
        let result = await this.locateField(key);
        if (result.success) {
            return result.match.groups.value;
        }
        return null;
    }
    async setValue(key: string, value: string) {
        let result = await this.locateField(key);
        let lines = await this.getLines();
        let newLine = `${key} :: ${value}`;
        if (!value) {
            newLine = "";
        }
        if (result.success) {
            if (newLine) {
                lines[result.lineno] = newLine;
            } else {
                lines.splice(result.lineno, 1);
            }
            let newContent = lines.join("\n");
            await this.plugin.app.vault.modify(this.file, newContent);
            return;
        } else {
            if (!newLine) {
                return;
            }
            let lineno = 0;
            // skip frontmatter
            if (lines[0].trim() === "---") {
                lineno = 1;
                while (
                    lineno < lines.length &&
                    lines[lineno].trim() !== "---"
                ) {
                    lineno++;
                }
                if (lineno == lines.length) {
                    // first line after leading "---", since it is unpaired
                    lineno = 1;
                } else {
                    // next line after second "---"
                    lineno++;
                }
            }
            let firstLineAfterFrontmatter = lineno;
            // skip blank lines
            while (lineno < lines.length && !lines[lineno].trim().length) {
                lineno++;
            }
            if (lineno == lines.length) {
                // the document is empty or contains only frontmatter
                lineno = firstLineAfterFrontmatter;
            } else {
                // skip preceding fields
                let fieldOrder = getFieldOrder(this.note.type);
                let currentFieldOrder = fieldOrder[key];
                for (; lineno < lines.length; lineno++) {
                    let line = lines[lineno];
                    let match = regexField.exec(line);
                    if (!match) {
                        break;
                    }
                    let order = fieldOrder[match.groups.field];
                    if (order > currentFieldOrder) {
                        break;
                    }
                }
            }
            lines.splice(lineno, 0, newLine);
            let newContent = lines.join("\n");
            await this.plugin.app.vault.modify(this.file, newContent);
            return;
        }
    }
}

export async function autoFieldAccessor(
    path: string,
    plugin: TypingPlugin
): Promise<EditorFieldAccessor | PreviewFieldAccessor> {
    let note = new Note(path);
    let activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (
        activeView &&
        activeView.getMode() == "source" &&
        activeView.file.path === path
    ) {
        return new EditorFieldAccessor(activeView.editor, note);
    } else {
        return new PreviewFieldAccessor(
            plugin.app.vault.getAbstractFileByPath(path) as TFile,
            plugin,
            note
        );
    }
}

function getFieldOrder(type: Type): { [name: string]: number } {
    let result: { [name: string]: number } = {};
    if (!type.fields) {
        return result;
    }
    let index = 0;
    for (let name in type.fields) {
        result[name] = index;
        index++;
    }
    return result;
}
