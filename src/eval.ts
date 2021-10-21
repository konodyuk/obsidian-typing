import { MarkdownRenderer } from "obsidian";
import { DataviewApi } from "obsidian-dataview";
import { Type } from "./type";

export class ScriptContext {
    static PREAMBLE: string = `
        let dv = this.dv; 
        let sourcePath = this.sourcePath; 
        let containerEl = this.containerEl;
        let renderMarkdown = this.renderMarkdown;
        let md = renderMarkdown;
        let type = this.noteType.name;
        let typeObject = this.noteType;
        let page = this.page;
    `;

    constructor(
        public dv: DataviewApi,
        public sourcePath: string,
        public containerEl: HTMLElement,
        public noteType: Type,
        public page?: any
    ) {}

    evalScript(script: string) {
        return function () {
            return eval(ScriptContext.PREAMBLE + script);
        }.call(this);
    }

    async asyncEvalScript(script: string) {
        // TODO: ensure it returns a value, because now it doesn't
        let result = await this.evalScript(
            "(async () => { " + script + " })()"
        );
        return result;
    }

    renderMarkdown = (source: string, containerEl: HTMLElement) => {
        if (!containerEl) {
            containerEl = this.containerEl;
        }
        MarkdownRenderer.renderMarkdown(
            source,
            containerEl,
            this.sourcePath,
            null
        );
    };
}
