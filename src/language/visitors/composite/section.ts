import { snippet, startCompletion } from "@codemirror/autocomplete";
import * as Visitors from ".";
import { createVisitor, Rules, TChildrenBase, TVisitorBase } from "../index_base";
import * as Wrappers from "../wrappers";

export const Section = <V extends TVisitorBase>(name: string, member: V, info?: string) =>
    createVisitor({
        rules: Rules.SectionDeclaration,
        accept(node) {
            let nameNode = node.getChild(Rules.Identifier);
            if (!nameNode) return;
            return this.children.name.run(nameNode) == name;
        },
        children: {
            name: Visitors.Identifier(),
            body: createVisitor({
                rules: Rules.SectionBody,
                children: { member },
                run(node) {
                    type R = V extends TVisitorBase<infer X> ? X : never;
                    let result: R[] = [];
                    this.traverse((node, child) => {
                        result.push(child.run(node));
                    });
                    return result;
                },
            }).extend(Wrappers.ScopeWrapper({ shouldComplete: false })),
        },
        snippets() {
            return [
                {
                    label: `${name} { ... }`,
                    apply: (view, completion, from, to) => {
                        snippet(`${name} {\n\t\${}\n}`)(view, completion, from, to);
                        startCompletion(view);
                    },
                    info,
                    detail: "section",
                    section: "section",
                    symbol: name,
                },
            ];
        },
        symbols(node) {
            let nameNode = node.getChild(Rules.Identifier);
            let name = this.children.name.run(nameNode);
            return [{ name, nameNode, node }];
        },
        run(node) {
            return this.runChildren();
        },
    });

export const StructuredSection = <Children extends TChildrenBase>(name: string, members: Children, info?: string) =>
    createVisitor({
        rules: Rules.SectionDeclaration,
        accept(node) {
            let nameNode = node.getChild(Rules.Identifier);
            if (!nameNode) return;
            return this.children.name.run(nameNode) == name;
        },
        children: {
            name: Visitors.Identifier(),
            body: createVisitor({
                rules: Rules.SectionBody,
                children: members,
                run(node) {
                    return this.runChildren();
                },
            }).extend(Wrappers.ScopeWrapper({ shouldComplete: true })),
        },
        snippets() {
            return [
                {
                    label: `${name} { ... }`,
                    apply: (view, completion, from, to) => {
                        snippet(`${name} {\n\t\${}\n}`)(view, completion, from, to);
                        startCompletion(view);
                    },
                    info,
                    detail: "section",
                    section: "section",
                    symbol: name,
                },
            ];
        },
        symbols(node) {
            let nameNode = node.getChild(Rules.Identifier);
            let name = this.children.name.run(nameNode);
            return [{ name, nameNode, node }];
        },
        run(node) {
            return this.runChildren();
        },
    });
