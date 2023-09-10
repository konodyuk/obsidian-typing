import { snippetCompletion } from "@codemirror/autocomplete";
import { gctx } from "src/context";
import { ExprScript, FnScript } from "src/scripting";
import { Values } from "src/typing";
import { dedent } from "src/utilities/dedent";
import * as Visitors from ".";
import { createVisitor, Rules } from "../index_base";

// TODO: reimplement with `tag` as an Identifier() child
export const TaggedString = ({ tags, strict = false }: { tags: string[]; strict?: boolean }) =>
    createVisitor({
        rules: Rules.TaggedString,
        accept(node) {
            if (!strict) {
                return true;
            }
            let nodeTag = node.getChild(Rules.Tag);
            return tags.contains(this.getNodeText(nodeTag));
        },
        lint(node) {
            let nodeTag = node.getChild(Rules.Tag);
            let tag = this.getNodeText(nodeTag);

            if (!tags.contains(tag)) {
                this.error(`Invalid tag: ${tag}, allowed tags: ${tags}`, nodeTag);
            }
        },
        snippets() {
            return [
                ...tags.map((x) =>
                    snippetCompletion(x + '"""\n\t${}\n"""', {
                        label: x + '"""..."""',
                        info: "multiline string",

                        detail: "tagged string",
                    })
                ),
                ...tags.map((x) =>
                    snippetCompletion(x + '"${}"', {
                        label: x + '"..."',
                        info: "string",

                        detail: "tagged string",
                    })
                ),
            ];
        },
    });

export const FnScriptString = (content = "\n\t${}\n", tags = ["fn", "function"]) =>
    TaggedString({ tags, strict: true }).override({
        children: {
            code: Visitors.String,
        },
        run(node) {
            if (!gctx.settings.enableScripting) return undefined;
            return FnScript.new({
                source: dedent(this.runChild("code")),
                filePath: this.globalContext?.callContext?.interpreter?.activeModule?.file?.path,
            });
        },
        lint(node) {
            let result = FnScript.validate(this.runChild("code"));
            if (!gctx.settings.enableScripting) {
                this.warning(
                    "Safe mode: JS scripting is currently disabled. Until you enable it in the plugin settings, this expression will be ignored.",
                    node.getChild(Rules.Tag)
                );
                return;
            }
            if (result.message) {
                this.error(result.message, node.getChild(Rules.Tag));
            }
        },
        snippets() {
            return [
                ...tags.map((x) =>
                    snippetCompletion(x + `"""${content}"""`, {
                        label: x + `"""${content}"""`.replace("${}", "..."),
                        info: "Function script",
                        detail: "tagged string",
                    })
                ),
            ];
        },
    });

export const ExprScriptString = (content = "\n\t${}\n", tags = ["expr", "expression"]) =>
    TaggedString({ tags, strict: true }).override({
        children: {
            code: Visitors.String,
        },
        run(node) {
            if (!gctx.settings.enableScripting) return undefined;
            return ExprScript.new({
                source: dedent(this.runChild("code")),
                filePath: this.globalContext?.callContext?.interpreter?.activeModule?.file?.path,
            });
        },
        lint(node) {
            let result = ExprScript.validate(this.runChild("code"));
            if (!gctx.settings.enableScripting) {
                this.warning(
                    "Safe mode: JS scripting is currently disabled. Until you enable it in the plugin settings, this expression will be ignored.",
                    node.getChild(Rules.Tag)
                );
                return;
            }
            if (result.message) {
                this.error(result.message, node.getChild(Rules.Tag));
            }
        },
        snippets() {
            return [
                ...tags.map((x) =>
                    snippetCompletion(x + `"""${content}"""`, {
                        label: x + `"""${content}"""`.replace("${}", "..."),
                        info: "Function script",
                        detail: "tagged string",
                    })
                ),
            ];
        },
    });

export const MarkdownString = (tags = ["md", "markdown"]) =>
    TaggedString({ tags, strict: true }).override({
        children: {
            code: Visitors.String,
        },
        run(node) {
            return new Values.Markdown(dedent(this.runChild("code")));
        },
        snippets() {
            return [
                ...tags.map((x) =>
                    snippetCompletion(x + '"""${}"""', {
                        label: x + '""" ... """',
                        info: "Markdown string",
                        detail: "tagged string",
                    })
                ),
            ];
        },
    });

export const CSSString = (tags = ["css"]) =>
    TaggedString({ tags, strict: true }).override({
        children: {
            code: createVisitor({
                rules: Rules.String,
            }),
        },
        snippets() {
            return [
                ...tags.map((x) =>
                    snippetCompletion(x + '"""${}"""', {
                        label: x + '""" ... """',
                        info: "Markdown string",
                        detail: "tagged string",
                    })
                ),
            ];
        },
    });
