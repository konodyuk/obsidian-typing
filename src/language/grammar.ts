import Parsimmon, { Index, Parser } from "parsimmon";
import { ctx } from "src/context";
import { JSXScript, Script } from "src/script";
import { Action } from "src/typing/action";
import { Field } from "src/typing/field";
import {
    AtomFieldType,
    ChoiceFieldType,
    FieldType,
    ListFieldType,
    NoteFieldType,
    TextFieldType,
} from "src/typing/field_type";
import { Prefix } from "src/typing/prefix";
import { Registry } from "src/typing/registry";
import { Type, TypeArguments } from "src/typing/type";
import {
    Appearance,
    IconValue,
    LoadValue,
    Marginal,
    MarkdownValue,
    Settings,
    TextValue,
} from "src/typing/value";

const P = Parsimmon;

const WS = P.regexp(/[ \n]*/);

function token(s: string) {
    return P.string(s).trim(WS);
}

export class NodeLike {
    _pos: {
        start: Index;
        end: Index;
    };
}

interface OTLGrammarTyping {
    WS1: string;
    EQUALS: string;
    LBRACE: string;
    RBRACE: string;
    LPAREN: string;
    RPAREN: string;
    STRING: String & NodeLike;
    LONG_STRING: String & NodeLike;

    file: Registry & NodeLike;
    type: Type & NodeLike;
    typeName: String & NodeLike;
    typeParents: Array<String & NodeLike> & NodeLike;
    typeFolder: { folder: String & NodeLike };
    typeIcon: { icon: String & NodeLike };
    typePrefix: { prefix: Prefix & NodeLike };
    typeInitializer: { initializer: Script & NodeLike };
    typeAppearanceSection: { appearance: Appearance & NodeLike };
    appearanceIcon: { icon: IconValue };
    appearanceLink: { link: Script & NodeLike };
    appearanceHeader: { header: Marginal & NodeLike };
    appearanceFooter: { footer: Marginal & NodeLike };
    appearanceShowPrefix: { show_prefix: string };
    typeFieldsSection: {
        fields: Record<string, Field & NodeLike>;
    };
    fieldAssignment: { [name: string]: Field & NodeLike };
    fieldType: FieldType & NodeLike;
    atomFieldType: AtomFieldType & NodeLike;
    noteFieldType: NoteFieldType & NodeLike;
    choiceFieldType: ChoiceFieldType & NodeLike;
    textFieldType: TextFieldType & NodeLike;
    listFieldType: ListFieldType & NodeLike;
    actionsSection: {
        actions: Record<string, Action & NodeLike>;
    };
    actionAssignment: { [name: string]: Action & NodeLike };
    actionScriptAssignment: { script: Script & NodeLike };
    actionIconAssignment: { icon: String & NodeLike };
    settingsSection: { settings: Settings & NodeLike };
    settingAssignment: { [name: string]: TextValue & NodeLike };

    defaultActionsSection: {
        actions: Record<string, Action & NodeLike>;
    };
    defaultSettingsSection: { settings: Settings & NodeLike };

    marginalValue: Marginal & NodeLike;
    scriptValue: Script & NodeLike;
    plainScriptValue: Script & NodeLike;
    JSXScriptValue: JSXScript & NodeLike;
    markdownValue: MarkdownValue & NodeLike;
    textValue: TextValue & NodeLike;
    loadValue: TextValue & NodeLike;
}

export const OTLGrammar = P.createLanguage<OTLGrammarTyping>({
    // tokens
    WS1: () => P.regexp(/[ ]+/),
    EQUALS: () => token("="),
    LBRACE: () => token("{"),
    RBRACE: () => token("}"),
    LPAREN: () => token("("),
    RPAREN: () => token(")"),
    STRING: () =>
        P.regexp(/".*?"/)
            .map((x) => new String(x.substring(1, x.length - 1)))
            .thru(toNodeLike),
    LONG_STRING: () =>
        P.regexp(/""".*?"""/s)
            .map((x) => new String(x.substring(3, x.length - 3)))
            .thru(toNodeLike),

    // file
    file: (r) =>
        P.alt(
            r.type.map((value) => {
                return { type: "type", value: value };
            }),
            r.defaultSettingsSection.map((value) => {
                return { type: "settings", value: value };
            }),
            r.defaultActionsSection.map((value) => {
                return { type: "actions", value: value };
            })
        )
            .many()
            .map(
                (
                    value: Array<
                        | { type: "type"; value: Type & NodeLike }
                        | {
                              type: "settings";
                              value: { settings: Settings & NodeLike };
                          }
                        | {
                              type: "actions";
                              value: {
                                  actions: Record<string, Action & NodeLike>;
                              };
                          }
                    >
                ) => {
                    let settings = null;
                    let actions = null;
                    for (let entry of value) {
                        if (entry.type == "settings") {
                            if (settings != null) {
                                throw new CompilationError({
                                    msg: "Duplicate default settings section",
                                    node: entry.value.settings,
                                });
                            }
                            settings = entry.value.settings;
                        }
                        if (entry.type == "actions") {
                            if (actions != null) {
                                for (let key in entry.value.actions) {
                                    throw new CompilationError({
                                        msg: "Duplicate default actions section",
                                        node: entry.value.actions[key],
                                    });
                                }
                            }
                            actions = entry.value.actions;
                        }
                    }

                    let registry = new Registry();
                    registry.settings = settings;
                    registry.actions = actions;

                    for (let entry of value) {
                        if (entry.type != "type") {
                            continue;
                        }
                        let newType = entry.value;
                        for (
                            let parentIndex = 0;
                            parentIndex < newType.parents.length;
                            parentIndex++
                        ) {
                            let parentName = newType.parents[parentIndex];
                            if (!(parentName in registry.types)) {
                                let parentNode =
                                    newType.args.parents[parentIndex];
                                throw new CompilationError({
                                    msg: "Parent type does not exist",
                                    node: parentNode,
                                });
                            }
                            let parentType = registry.byName(parentName);
                            newType.inherit(parentType);
                        }
                        registry.addType(newType);
                    }

                    return registry;
                }
            )
            .thru(toNodeLike),
    type: (r) =>
        P.seqMap(
            P.alt(
                P.seq(token("abstract"), token("type")).map(() => true),
                token("type").map(() => false)
            ),
            r.typeName,
            r.typeParents,
            P.alt(
                r.typeFolder,
                r.typeIcon,
                r.typePrefix,
                r.typeInitializer,
                r.typeAppearanceSection,
                r.typeFieldsSection,
                r.actionsSection,
                r.settingsSection
            )
                .sepBy(WS)
                .wrap(r.LBRACE, r.RBRACE),
            function (is_abstract, name, parents, body) {
                let args: TypeArguments = mergeDicts(body) as TypeArguments;
                args.is_abstract = is_abstract;
                args.name = name;
                args.parents = parents;

                return Type.fromArguments(args);
            }
        ).thru(toNodeLike),

    // type
    typeName: (r) => r.STRING,
    typeParents: (r) =>
        P.seqMap(
            token("extends"),
            r.STRING.sepBy(token(",")),
            function (kw, parents) {
                return parents;
            }
        )
            .fallback([])
            .thru(toNodeLike),
    typeFolder: (r) =>
        P.seqMap(token("folder"), r.EQUALS, r.STRING, function (kw, eq, value) {
            return { folder: value };
        }),
    typeIcon: (r) =>
        P.seqMap(token("icon"), r.EQUALS, r.STRING, function (kw, eq, value) {
            return { icon: value };
        }),
    typePrefix: (r) =>
        P.seqMap(token("prefix"), r.EQUALS, r.STRING, function (kw, eq, value) {
            let prefix = new Prefix(value.valueOf());
            return {
                prefix: setPos(prefix, value._pos.start, value._pos.end),
            };
        }),
    typeInitializer: (r) =>
        P.seqMap(
            token("initializer"),
            r.EQUALS,
            r.scriptValue,
            function (kw, eq, value) {
                return { initializer: value };
            }
        ),

    // appearance
    typeAppearanceSection: (r) =>
        P.seqMap(
            token("appearance"),
            P.index,
            P.alt(
                r.appearanceIcon,
                r.appearanceLink,
                r.appearanceHeader,
                r.appearanceFooter,
                r.appearanceShowPrefix
            )
                .sepBy(WS)
                .wrap(r.LBRACE, r.RBRACE),
            P.index,
            function (kw, start, section, end) {
                let { icon, link, header, footer, show_prefix } =
                    mergeDicts(section);
                return {
                    appearance: setPos(
                        new Appearance(icon, link, header, footer, show_prefix),
                        start,
                        end
                    ),
                };
            }
        ),
    appearanceIcon: (r) =>
        P.seqMap(
            token("icon"),
            r.EQUALS,
            P.alt(
                r.STRING.map((value) => {
                    return {
                        string: value,
                    };
                }),
                r.scriptValue.map((value) => {
                    return {
                        script: value,
                    };
                })
            ),
            function (kw, eq, value) {
                let { string, script } = value as unknown as {
                    string?: string;
                    script?: Script;
                };
                return { icon: new IconValue(string, script) };
            }
        ),
    appearanceLink: (r) =>
        P.seqMap(
            token("link"),
            r.EQUALS,
            r.scriptValue,
            function (kw, eq, value) {
                return { link: value };
            }
        ),
    appearanceHeader: (r) =>
        P.seqMap(
            token("header"),
            r.EQUALS,
            r.marginalValue,
            function (kw, eq, value) {
                return { header: value };
            }
        ),
    appearanceFooter: (r) =>
        P.seqMap(
            token("footer"),
            r.EQUALS,
            r.marginalValue,
            function (kw, eq, value) {
                return { footer: value };
            }
        ),
    appearanceShowPrefix: (r) =>
        P.seqMap(
            token("show_prefix"),
            r.EQUALS,
            P.alt(token("auto"), token("always"), token("never")),
            function (kw, eq, value) {
                return { show_prefix: value };
            }
        ),

    // fields
    typeFieldsSection: (r) =>
        P.seqMap(
            token("fields"),
            P.index,
            r.fieldAssignment.sepBy(WS).wrap(r.LBRACE, r.RBRACE),
            P.index,
            function (kw, start, assignments, end) {
                return { fields: mergeDicts(assignments) };
            }
        ),
    fieldAssignment: (r) =>
        P.seqMap(
            P.index,
            r.STRING.trim(WS),
            r.EQUALS,
            r.fieldType,
            P.index,
            function (start, name, eq, type, end) {
                let field = new Field(name.valueOf(), type);
                return { [name.valueOf()]: setPos(field, start, end) };
            }
        ),
    fieldType: (r) => P.alt(r.listFieldType, r.atomFieldType),
    atomFieldType: (r) =>
        P.alt(r.noteFieldType, r.choiceFieldType, r.textFieldType),
    noteFieldType: (r) =>
        P.seqMap(
            token("note"),
            r.STRING.trim(WS).sepBy1(token(",")).wrap(r.LPAREN, r.RPAREN),
            function (kw, options) {
                return new NoteFieldType(
                    options.map((x) => x.valueOf()),
                    options
                );
            }
        ).thru(toNodeLike),
    choiceFieldType: (r) =>
        P.seqMap(
            token("choice"),
            r.STRING.trim(WS).sepBy1(token(",")).wrap(r.LPAREN, r.RPAREN),
            function (kw, options) {
                return new ChoiceFieldType(
                    options.map((x) => x.valueOf()),
                    options
                );
            }
        ).thru(toNodeLike),
    textFieldType: (r) =>
        P.seqMap(
            token("text"),
            WS.wrap(r.LPAREN, r.RPAREN),
            function (kw, options) {
                return new TextFieldType();
            }
        ).thru(toNodeLike),
    listFieldType: (r) =>
        P.seqMap(
            token("list"),
            r.atomFieldType.wrap(r.LPAREN, r.RPAREN),
            function (kw, atom) {
                return new ListFieldType(atom);
            }
        ).thru(toNodeLike),

    // actions
    actionsSection: (r) =>
        P.seqMap(
            token("actions"),
            r.actionAssignment.sepBy(WS).wrap(r.LBRACE, r.RBRACE),
            function (kw, assignments) {
                return { actions: mergeDicts(assignments) };
            }
        ),
    actionAssignment: (r) =>
        P.seqMap(
            P.alt(
                token("pinned").map(() => true),
                WS.map(() => false)
            ),
            r.STRING.trim(WS),
            r.EQUALS,
            P.alt(r.actionScriptAssignment, r.actionIconAssignment)
                .sepBy(WS)
                .wrap(r.LBRACE, r.RBRACE)
                .map(function (assignments) {
                    let { script, icon } = mergeDicts(assignments);
                    return { script: script, icon: icon };
                }),
            function (is_pinned, name, eq, value) {
                if (value.script == null) {
                    throw new CompilationError({
                        msg: "Script should be specified",
                        node: name,
                    });
                }
                if (value.icon == null) {
                    throw new CompilationError({
                        msg: "Icon should be specified",
                        node: name,
                    });
                }

                return {
                    [name.valueOf()]: setPos(
                        new Action(
                            is_pinned,
                            name.valueOf(),
                            value.script,
                            value.icon
                        ),
                        name._pos.start,
                        name._pos.end
                    ),
                };
            }
        ),
    actionScriptAssignment: (r) =>
        P.seqMap(
            token("script"),
            r.EQUALS,
            r.scriptValue,
            function (kw, eq, value) {
                return { script: value };
            }
        ),
    actionIconAssignment: (r) =>
        P.seqMap(
            token("icon"),
            r.EQUALS,
            r.STRING.trim(WS),
            function (kw, eq, value) {
                return { icon: value };
            }
        ),

    // settings
    settingsSection: (r) =>
        P.seqMap(
            token("settings"),
            P.index,
            r.settingAssignment.sepBy(WS).wrap(r.LBRACE, r.RBRACE),
            P.index,
            function (kw, start, assignments, end) {
                let settings = mergeDicts(assignments) as Settings;
                return { settings: setPos(settings, start, end) };
            }
        ),
    settingAssignment: (r) =>
        P.seqMap(
            r.STRING.trim(WS),
            r.EQUALS,
            r.textValue,
            function (name, eq, value) {
                return { [name.valueOf()]: value };
            }
        ),

    defaultSettingsSection: (r) =>
        P.seqMap(token("default"), r.settingsSection, function (kw, section) {
            return section;
        }),

    defaultActionsSection: (r) =>
        P.seqMap(token("default"), r.actionsSection, function (kw, section) {
            return section;
        }),

    // values
    marginalValue: (r) =>
        P.alt(
            r.markdownValue.map((value) => {
                return {
                    markdown: value,
                };
            }),
            r.scriptValue.map((value) => {
                return {
                    script: value,
                };
            })
        )
            .map(function (value) {
                let { script, markdown } = value as unknown as {
                    markdown?: MarkdownValue;
                    script?: Script;
                };

                return new Marginal(script, markdown);
            })
            .thru(toNodeLike),
    scriptValue: (r) => P.alt(r.plainScriptValue, r.JSXScriptValue),
    plainScriptValue: (r) =>
        P.seqMap(
            token("script"),
            r.textValue.wrap(r.LPAREN, r.RPAREN),
            function (kw, value) {
                return new Script(value);
            }
        ).thru(toNodeLike),
    JSXScriptValue: (r) =>
        P.seqMap(
            token("jsxscript"),
            r.textValue.wrap(r.LPAREN, r.RPAREN),
            function (kw, value) {
                return new JSXScript(value);
            }
        ).thru(toNodeLike),
    markdownValue: (r) =>
        P.seqMap(
            token("markdown"),
            r.textValue.wrap(r.LPAREN, r.RPAREN),
            function (kw, value) {
                return new MarkdownValue(value);
            }
        ).thru(toNodeLike),
    textValue: (r) =>
        P.alt(
            r.LONG_STRING.map((x) => {
                return {
                    value: x,
                };
            }),
            r.STRING.map((x) => {
                return {
                    value: x,
                };
            }),
            r.loadValue.map((x) => {
                return {
                    load: x,
                };
            })
        )
            .map((options) => new TextValue(options))
            .thru(toNodeLike),
    loadValue: (r) =>
        P.seqMap(
            P.alt(token("include"), token("load")),
            r.STRING.wrap(r.LPAREN, r.RPAREN),
            function (kw, value) {
                let file = ctx.app.vault.getAbstractFileByPath(value.valueOf());
                if (file == null) {
                    throw new CompilationError({
                        msg: `Included file does not exist: ${value}`,
                        node: value,
                    });
                }
                return new TextValue({
                    load: new LoadValue(value.valueOf()),
                });
            }
        ).thru(toNodeLike),
});

interface CompilationSuccessOutput {
    status: true;
    registry: Registry;
}
interface CompilationErrorOutput {
    status: false;
    index: Index;
    length: number;
    error: string;
}
type CompilationOutput = CompilationSuccessOutput | CompilationErrorOutput;

export class CompilationError {
    msg: string;
    index: Index;
    length: number = 1;
    constructor({
        msg,
        index,
        length,
        range,
        node,
    }: {
        msg: string;
        index?: Index;
        length?: number;
        range?: { start: Index; end: Index };
        node?: NodeLike;
    }) {
        if (node) {
            range = node._pos;
        }
        if (range) {
            index = range.start;
            length = range.end.offset - range.start.offset;
        }
        if (index == null) {
            index = { offset: 0, line: 1, column: 1 };
        }
        if (length == null) {
            length = 1;
        }

        this.msg = msg;
        this.index = index;
        this.length = length;
    }
}

export function compile(code: string): CompilationOutput {
    let output;

    try {
        output = OTLGrammar.file.parse(code);
    } catch (e) {
        if (e instanceof CompilationError) {
            return {
                status: false,
                index: e.index,
                length: e.length,
                error: e.msg,
            } as CompilationErrorOutput;
        }

        console.log("Typing: unknown error during compilation:", e);
        return {
            status: false,
            index: { column: 1, line: 1, offset: 0 },
            length: 1,
            error: `Unknown error: ${e.message}`,
        } as CompilationErrorOutput;
    }

    if (output.status == true) {
        return {
            status: true,
            registry: output.value,
        } as CompilationSuccessOutput;
    } else {
        return {
            status: false,
            index: output.index,
            length: 1,
            error: `Syntax Error. Expected one of:\n${output.expected.join(
                ","
            )}`,
        } as CompilationErrorOutput;
    }
}

function mergeDicts(dicts: Array<Record<string, any>>): Record<string, any> {
    let result = {};
    for (let dict of dicts) {
        result = { ...result, ...dict };
    }
    return result;
}

function setPos<T>(value: T, start: Index, end: Index): T & NodeLike {
    let result = value as T & NodeLike;
    result._pos = { start: start, end: end };
    return result;
}

function toNodeLike<T>(r: Parser<T>) {
    return r.mark().map(({ start, value, end }) => {
        return setPos(value, start, end);
    });
}
