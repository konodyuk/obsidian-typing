import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter } from "@codemirror/lint";
import { SyntaxNode } from "@lezer/common";
import { gctx } from "src/context";
import { Rules } from "src/language/grammar";
import { TVisitorBase, Visitors } from "src/language/visitors";
import { codeEditorMetadataField } from "./state_fields";

interface Linter {
    rule: Rules | null;
    lint: (node: SyntaxNode) => Diagnostic[];
}

export const visitorLinter = (rootVisitor: TVisitorBase) => {
    return linter(
        (view) => {
            let diagnostics: Diagnostic[] = [];
            let tree = syntaxTree(view.state);
            // hardcoded linters
            tree.cursor().iterate((node) => {
                for (let linter of Linters) {
                    if (linter.rule != null && linter.rule != node.name) {
                        continue;
                    }
                    let diag = linter.lint(node.node);
                    if (diag) {
                        diagnostics.push(...diag);
                    }
                }
            });
            // visitor linter
            diagnostics.push(
                ...rootVisitor.lint(syntaxTree(view.state).topNode, {
                    state: view.state,
                    interpreter: gctx.interpreter,
                    path: view.state.field(codeEditorMetadataField).path,
                }).diagnostics
            );
            return diagnostics;
        },
        { delay: 300 }
    );
};

export const Linters: Linter[] = [
    {
        rule: null,
        lint(node) {
            let diagnostics: Diagnostic[] = [];
            if (node.type.isError)
                diagnostics.push({
                    from: node.from,
                    to: node.to,
                    severity: "error",
                    message: "Invalid syntax.",
                });
            return diagnostics;
        },
    },
];

export const lint = visitorLinter(Visitors.File);
