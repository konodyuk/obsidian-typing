import { snippet, startCompletion } from "@codemirror/autocomplete";
import * as Visitors from ".";
import { createVisitor, Rules, TVisitorBase } from "../index_base";

export const List = (valueType: TVisitorBase, opts?: { info?: string }) =>
    createVisitor({
        rules: Rules.List,
        children: {
            value: Visitors.Literal(valueType),
        },
        complete(node) {
            return valueType.snippets();
        },
        run() {
            let result: ReturnType<(typeof valueType)["run"]>[] = [];
            let unexpectedNodes = [];
            this.traverse(
                (node, child) => {
                    result.push(child.run(node));
                },
                {
                    callbackNotAccepted(node) {
                        unexpectedNodes.push(node);
                    },
                }
            );
            for (let node of unexpectedNodes) this.error("Unexpected value type", node);
            return result;
        },
        snippets() {
            return [
                {
                    label: `[ ... ]`,
                    apply: (view, completion, from, to) => {
                        snippet("[${}]")(view, completion, from, to);
                        startCompletion(view);
                    },
                    info: opts?.info,
                    detail: "list",
                },
            ];
        },
    });
