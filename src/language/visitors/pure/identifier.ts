import { stripQuotes } from "src/utilities";
import { createVisitor, Rules } from "../index_base";

export const Identifier = (opts?: { allowString: boolean }) =>
    createVisitor({
        rules: [Rules.LooseIdentifier, Rules.Identifier],
        children: {
            identifier: createVisitor({
                rules: Rules.Identifier,
                run(node) {
                    return this.getNodeText(node);
                },
            }),
            stringIdentifier: createVisitor({
                rules: Rules.StringIdentifier,
                run(node): string {
                    let text = this.getNodeText(node);
                    return stripQuotes(text);
                },
            }),
        },
        tags: ["identifier"],
        lint(node) {
            if (
                !opts?.allowString &&
                node.name == Rules.LooseIdentifier &&
                node.getChild(Rules.StringIdentifier) != null
            )
                this.warning({
                    message: "String identifiers are not allowed here.",
                    actions: [
                        {
                            name: "Convert to identifier",
                            apply(view, from, to) {
                                view.dispatch({ changes: { from, to: from + 1 } }, { changes: { from: to - 1, to } });
                            },
                        },
                    ],
                });
        },
        run(): string {
            let result = this.runChildren({
                keys: ["identifier", "stringIdentifier"],
                eager: true,
                traversalOptions: { visitTop: true, visitChildren: true },
            });
            return result["identifier"] ?? result["stringIdentifier"];
        },
    });
