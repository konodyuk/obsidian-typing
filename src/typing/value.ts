import { TFile } from "obsidian";
import { ctx } from "src/context";
import { Script } from "../script/script";
import { Note } from "./note";

export class LoadValue {
    constructor(public path: string) {}
    async value(): Promise<string> {
        let file = ctx.app.vault.getAbstractFileByPath(this.path);
        return await ctx.app.vault.cachedRead(file as TFile);
    }
}

export class TextValue {
    private _value: string = null;
    private _load: LoadValue = null;
    constructor({ value, load }: { value?: string; load?: LoadValue }) {
        if (value == null && load == null) {
            throw Error(
                "Either value or promise should be specified in TextValue"
            );
        }
        if (value != null && load != null) {
            throw Error(
                "Both value and promise cannot be specified in TextValue"
            );
        }
        if (value != null) {
            this._value = value;
            return;
        }
        this._load = load;
    }
    async value(): Promise<string> {
        if (this._value == null) {
            this._value = await this._load.value();
        }
        return this._value;
    }
}

export class IconValue {
    constructor(public string?: string, public script?: Script) {}
    async value(note: Note): Promise<string> {
        if (this.string) {
            return this.string;
        }
        let result = await this.script
            .run({
                note: note,
            })
            .catch((reason) =>
                console.log(`Error rendering link for ${note.path}: ${reason}`)
            );
        return result || "";
    }
}
export class MarkdownValue {
    constructor(public source: TextValue) {}
}
export class Marginal {
    constructor(public script?: Script, public markdown?: MarkdownValue) {}
    async render(note: Note, container: HTMLElement): Promise<any> {
        if (this.script) {
            return await this.script.run({ note: note, container: container });
        }
        if (this.markdown) {
            console.log("markdown marginal is not supported yet");
        }
    }
}
export class Appearance {
    constructor(
        public icon?: IconValue,
        public link?: Script,
        public header?: Marginal,
        public footer?: Marginal,
        public show_prefix?: "auto" | "always" | "never"
    ) {}
}
export class Settings {
    preamble: TextValue = new TextValue({ value: "" });
}
