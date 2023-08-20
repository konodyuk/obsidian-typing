import { snippetCompletion } from "@codemirror/autocomplete";
import { stripQuotes } from "src/utilities";
import { createVisitor, Rules, TVisitorBase } from "../index_base";

export const String = createVisitor({
    rules: Rules.String,
    run(node) {
        return stripQuotes(this.getNodeText(node));
    },
    snippets() {
        return [
            snippetCompletion('"""\n\t${}\n"""', { label: '"""..."""', info: "multiline string", detail: "string" }),
            snippetCompletion('"${}"', { label: '"..."', info: "string", detail: "string" }),
        ];
    },
    complete() {
        return [];
    },
});

export const Number = createVisitor({
    rules: Rules.Number,
    run(node) {
        return +this.getNodeText(node);
    },
    snippets() {
        return [];
    },
});

export const Boolean = createVisitor({
    rules: Rules.Boolean,
    run(node) {
        return this.getNodeText(node) == "true";
    },
    snippets() {
        return [
            { label: "true", detail: "boolean" },
            { label: "false", detail: "boolean" },
        ];
    },
});

export const LiteralString = (values: string[]) =>
    String.override({
        lint(node) {
            if (!values.contains(stripQuotes(this.getNodeText(node)))) {
                this.error(`Allowed values: ${values}`);
            }
        },
        snippets() {
            return values.map((value) => ({ label: `"${value}"`, info: "string", detail: "string" }));
        },
    });

export const Literal = (type: TVisitorBase) =>
    createVisitor({
        rules: Rules.Literal,
        children: { type },
        lint(node) {
            let content = node.firstChild;
            if (!content) return;
            if (!type.accept(content)) {
                this.error("Invalid type", content);
            }
        },
        run(node) {
            return this.runChildren()["type"];
        },
        snippets() {
            return type.snippets();
        },
        complete(node, context) {
            let content = node.firstChild;
            if (!content) return [];
            if (type.accept(content)) {
                return type.complete(content, context);
            }
            return [];
        },
    });
