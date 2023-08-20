import { snippet, startCompletion } from "@codemirror/autocomplete";
import * as Visitors from ".";
import { createVisitor, Rules, TVisitorBase } from "../index_base";

export const NamedAttribute = (valueType: TVisitorBase) =>
    createVisitor({
        rules: Rules.Assignment,
        children: {
            name: Visitors.Proxy(Rules.AssignmentName, Visitors.Identifier()),
            value: createVisitor({
                rules: Rules.AssignmentValue,
                run() {
                    return this.runChildren({ keys: ["literal"], eager: true })["literal"];
                },
                children: { literal: Visitors.Literal(valueType) },
                complete() {
                    return valueType.snippets();
                },
            }),
        },
        complete(node) {
            let hasName = node.getChild(Rules.AssignmentName) != null;
            let valueNode = node.getChild(Rules.AssignmentValue);
            let hasValue = valueNode && this.getNodeText(valueNode).trim().length > 0;
            let hasEqual = this.getNodeText(node).contains("=");

            if (hasName && !hasValue && hasEqual) {
                return valueType.snippets();
            }

            return [];
        },
        run() {
            // return this.runChildren({ keys: ["value"], eager: true })["value"];
            return this.runChildren();
        },
        symbols(node) {
            let nameNode = node.getChild(Rules.AssignmentName);
            if (!nameNode) return;
            let name = this.children.name.run(nameNode);
            return [{ name, nameNode, node }];
        },
    });

export const Attribute = (name: string, valueType: TVisitorBase, info?: string) =>
    NamedAttribute(valueType).extend({
        accept(node) {
            if (name == null) return true;
            let nameNode = node.getChild(Rules.AssignmentName);
            if (!nameNode) return false;
            return this.children.name.run(nameNode) == name;
        },
        run() {
            return this.runChildren({ keys: ["value"], eager: true })["value"];
        },
        snippets() {
            return [
                {
                    label: `${name} = ...`,
                    apply: (view, completion, from, to) => {
                        snippet(`${name} = \${}`)(view, completion, from, to);
                        startCompletion(view);
                    },
                    info,
                    detail: "attribute",
                    section: "attribute",
                    symbol: name,
                },
            ];
        },
    });
