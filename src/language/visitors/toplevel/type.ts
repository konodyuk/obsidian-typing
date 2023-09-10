import { Completion, snippet, snippetCompletion } from "@codemirror/autocomplete";
import { Decoration, WidgetType } from "@codemirror/view";
import { Action, Field, Hook, HookContainer, Method, Prefix, Style, Type as TypeObject } from "src/typing";
import { stripQuotes } from "src/utilities";
import * as Visitors from "../composite";
import { createVisitor, Rules, Symbol } from "../index_base";
import * as Wrappers from "../wrappers";

class IconWidget extends WidgetType {
    constructor(readonly icon: string) {
        super();
    }

    eq(other: IconWidget) {
        return other.icon == this.icon;
    }

    toDOM() {
        let wrap = document.createElement("span");
        // wrap.className = "typing-icon-preview";
        let box = wrap.appendChild(document.createElement("span"));
        box.className = this.icon;
        return wrap;
    }

    ignoreEvent() {
        return false;
    }
}

export const TypeParentsClause = createVisitor({
    rules: Rules.ExtendsClause,
    children: { parent: Visitors.Identifier({ allowString: true }) },
    lint(node) {
        let globalTypes = this.utils.globalSymbols(node);
        this.traverse((node, child) => {
            let name = child.run(node);
            for (let type of globalTypes) {
                if (type.name == name && type.node.to <= node.from) {
                    return;
                }
            }
            this.error(`No such parent: ${name}`, node);
        });
    },
    run(node) {
        let result: string[] = [];
        this.traverse((node, child) => {
            let name = child.run(node);
            result.push(name);
        });
        return result;
    },
    complete(node) {
        let currentParents = this.symbols(node).map((x) => x.name);
        return this.utils
            .globalSymbols()
            .filter((x: Symbol) => x.node.to < node.from)
            .filter((x: Symbol) => !currentParents.contains(x.name))
            .map((x: Symbol) => {
                let name = x.name;

                // TODO: improve, check by regex or Identifier
                if (name.contains(" ")) {
                    name = `"${name}"`;
                }

                return {
                    label: name,
                    apply: (...args) => snippet(x.name)(...args),
                } as Completion;
            });
    },
    symbols() {
        let res: Symbol[] = [];
        this.traverse((node, child) => {
            let name = child.run(node);
            res.push({ node, nameNode: node, name: name });
        });
        return res;
    },
    utils: {
        globalSymbols() {
            let globalScope = this.getParent({ tags: ["scope"] });
            let globalScopeNode = this.node;
            while (globalScopeNode.name != Rules.File) globalScopeNode = globalScopeNode.parent;
            return globalScope.symbols(globalScopeNode) ?? [];
        },
    },
});

export const Type = createVisitor({
    rules: Rules.TypeDeclaration,
    tags: ["typedecl"],
    children: {
        // TODO: `abstract` keyword
        name: Visitors.Identifier({ allowString: true }),
        parents: TypeParentsClause,
        body: createVisitor({
            rules: Rules.TypeBody,
            run(node) {
                return this.runChildren();
            },
            children: {
                folder: Visitors.Attribute("folder", Visitors.String), // will be FolderCompletionString or String(completion=...)
                // TODO: can be specified only in abstract types
                // TODO: can be specified one of folder and glob
                glob: Visitors.Attribute("glob", Visitors.String), // will be FolderCompletionString or String(completion=...)

                // TODO: store current prefixes in `data.json`, on prefix change
                // rename all the notes in folder sorted by `cdate`, this way the order on {serial} will be preserved
                prefix: Visitors.Attribute("prefix", Visitors.String).override({
                    run(node) {
                        return Prefix.new({ template: this.super.run(node) });
                    },
                }),
                icon: Visitors.Attribute("icon", Visitors.String).override({
                    decorations(node) {
                        let valueNode = node.getChild(Rules.AssignmentValue);
                        if (!valueNode) return [];
                        let icon = stripQuotes(this.getNodeText(valueNode));
                        return [
                            Decoration.widget({
                                widget: new IconWidget(icon),
                                side: 1,
                            }).range(valueNode.to),
                        ];
                    },
                }),
                style: Visitors.StructuredSection(
                    "style",
                    {
                        header: Visitors.Attribute(
                            "header",
                            Visitors.Union(
                                Visitors.FnScriptString(),
                                Visitors.ExprScriptString(),
                                Visitors.MarkdownString()
                            )
                        ),
                        footer: Visitors.Attribute(
                            "footer",
                            Visitors.Union(
                                Visitors.FnScriptString(),
                                Visitors.ExprScriptString(),
                                Visitors.MarkdownString()
                            )
                        ),
                        link: Visitors.Attribute(
                            "link",
                            Visitors.Union(Visitors.FnScriptString(), Visitors.ExprScriptString())
                        ),
                        css: Visitors.Attribute("css", Visitors.TaggedString({ tags: ["css"] })),
                        css_classes: Visitors.Attribute("css_classes", Visitors.List(Visitors.String)),
                        show_prefix: Visitors.Attribute(
                            "show_prefix",
                            Visitors.LiteralString(["always", "smart", "never"])
                        ),
                        hide_inline_fields: Visitors.Attribute(
                            "hide_inline_fields",
                            Visitors.LiteralString(["all", "none", "defined"])
                        ),
                    },
                    "Style section"
                ).override({
                    run(node) {
                        let opts = this.runChildren({ keys: ["body"] })["body"];
                        return Style.new(opts);
                    },
                }),
                actions: Visitors.Section(
                    "actions",
                    Visitors.NamedAttribute(
                        Visitors.StructuredObject({
                            name: Visitors.Attribute("name", Visitors.String),
                            icon: Visitors.Attribute("icon", Visitors.String),
                            script: Visitors.Attribute("script", Visitors.FnScriptString()),
                            shortcut: Visitors.Attribute("shortcut", Visitors.String),
                        })
                    ).extend({
                        run() {
                            let { name: id, value } = this.super.runChildren();
                            return Action.new({ id, ...value });
                        },
                    })
                ).extend({
                    run(): Record<string, Action> {
                        let result: Record<string, Action> = {};
                        let action: Action;
                        for (action of this.super.runChildren()["body"]) {
                            result[action.id] = action;
                        }
                        return result;
                    },
                }),
                hooks: Visitors.StructuredSection(
                    "hooks",
                    {
                        create: Visitors.Attribute("create", Visitors.FnScriptString()),
                        on_create: Visitors.Attribute("on_create", Visitors.FnScriptString()),
                        on_rename: Visitors.Attribute("on_rename", Visitors.FnScriptString()),
                        on_open: Visitors.Attribute("on_open", Visitors.FnScriptString()),
                        on_close: Visitors.Attribute("on_close", Visitors.FnScriptString()),
                    },
                    "Hooks"
                ).extend({
                    run(node) {
                        let hooks = this.runChildren({ keys: ["body"] })["body"];
                        for (let key in hooks) {
                            hooks[key] = Hook.new({ func: hooks[key] });
                        }
                        return HookContainer.new(hooks);
                    },
                }),
                methods: Visitors.Section(
                    "methods",
                    Visitors.NamedAttribute(Visitors.ExprScriptString("(${params}) => {\n\t${}\n}"))
                ).extend({
                    run(node) {
                        let methodsList = this.runChildren()["body"];
                        let methods = {};
                        for (let { name, value } of methodsList) {
                            methods[name] = Method.new({ function: value });
                        }
                        return methods;
                    },
                }),
                fields: Visitors.Section("fields", Visitors.Field()).extend({
                    run(): Record<string, Field> {
                        let result: Record<string, Field> = {};
                        for (let field of this.super.runChildren()["body"]) {
                            result[field.name] = field;
                        }
                        return result;
                    },
                }),
            },
        }).extend(Wrappers.ScopeWrapper({ shouldComplete: true })),
    },
    run() {
        let { name, parents, body } = this.runChildren({ keys: ["name", "parents", "body"] });
        let type = TypeObject.new({
            name,
            parents,
            ...body,
        });
        return [type];
    },
    snippets() {
        return [
            snippetCompletion("type ${name} extends ${parents} {\n\t${}\n}", {
                label: "type ... extends ... { ... }",
                info: "A type with parents.",
            }),
            snippetCompletion("type ${name} {\n\t${}\n}", {
                label: "type ... { ... }",
                info: "A type without parents.",
            }),
        ];
    },
    // TODO: fix
    options: {
        cache: { lint: false, run: false, complete: false },
    },
    symbols(node) {
        let nameNode = node.getChild(Rules.LooseIdentifier);
        let name = this.children.name.run(nameNode);
        return [{ name, nameNode, node }];
    },
});
