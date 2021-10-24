import { MarkdownRenderer } from "obsidian";

export class EvalContext {
    public preamble: string;
    constructor(public namespace: any) {
        this.namespace["md"] = this.renderMarkdown;
        this.preamble = "";
        for (let key in namespace) {
            this.preamble += `let ${key} = this.namespace["${key}"];`;
        }
    }

    eval(script: string): any {
        return function () {
            return eval(this.preamble + script);
        }.call(this);
    }

    asyncEval(script: string): void {
        // Async scripts returning value are currently not supported..
        // URL: https://stackoverflow.com/questions/56187117/await-is-only-valid-in-async-function-eval-in-async
        this.eval(
            "(async () => { return eval(`" +
                script.replace("`", "\\`") +
                "`) })()"
        );
    }

    renderMarkdown = async (
        source: string,
        containerEl?: HTMLElement,
        sourcePath?: string
    ) => {
        if (!containerEl) {
            containerEl = this.namespace.containerEl;
        }
        if (!sourcePath) {
            sourcePath = this.namespace.note.path;
        }
        let subcontainerEl = containerEl.createSpan();
        await MarkdownRenderer.renderMarkdown(
            source,
            subcontainerEl,
            sourcePath,
            null
        );

        let parEl = subcontainerEl.querySelector("p");
        if (subcontainerEl.children.length == 1 && parEl) {
            while (parEl.firstChild) {
                subcontainerEl.appendChild(parEl.firstChild);
            }
            subcontainerEl.removeChild(parEl);
        }
    };
}
