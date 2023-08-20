import { snippet, startCompletion } from "@codemirror/autocomplete";
import { createVisitor, Rules, TChildrenBase } from "../index_base";
import * as Wrappers from "../wrappers";

export const StructuredObject = <Children extends TChildrenBase>(members: Children, info?: string) =>
    createVisitor({
        rules: Rules.Object,
        children: members,
        run() {
            return this.runChildren();
        },
        snippets() {
            return [
                {
                    label: `{ ... }`,
                    apply: (view, completion, from, to) => {
                        snippet(`{\n\t\${}\n}`)(view, completion, from, to);
                        startCompletion(view);
                    },
                    info,
                    detail: "object",
                    section: "object",
                },
            ];
        },
    }).extend(Wrappers.ScopeWrapper({ shouldComplete: true }));
