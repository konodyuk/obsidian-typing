import { autocompletion, moveCompletionSelection } from "@codemirror/autocomplete";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {
    continuedIndent,
    foldNodeProp,
    indentNodeProp,
    indentUnit,
    LanguageSupport,
    LRLanguage,
} from "@codemirror/language";
import { lintGutter } from "@codemirror/lint";
import { search, searchKeymap } from "@codemirror/search";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, keymap, Panel, tooltips, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Input, parseMixed, Parser, SyntaxNodeRef } from "@lezer/common";
import { styleTags, tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { Scope, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { parser, Rules } from "src/language/grammar";
import TypingPlugin from "src/main";
import { visitorCompletion } from "./completion";
import { decorationsPlugin } from "./decorations";
import { hover } from "./hover";
import { lint } from "./linting";
import { codeEditorMetadataField, setCodeEditorMetadataEffect } from "./state_fields";
import { obsidianCodeTheme } from "./themes/obsidian";

import styles from "src/styles/editor.scss";

const tsxLanguageSupport = javascript({ jsx: true, typescript: true });
const cssLanguageSupport = css();
const markdownLanguageSupport = markdown({ base: markdownLanguage });
const htmlLanguageSupport = html();

function trimQuotes(input: Input, node: SyntaxNodeRef): { from: number; to: number } | null {
    let from = node.from;
    let to = node.to;
    while (input.read(from, from + 1) == '"') {
        from++;
    }
    while (input.read(to - 1, to) == '"') {
        to--;
    }
    if (from >= to) {
        return null;
    }
    return { from, to };
}

const TAGGED_STRING_ISLAND_GRAMMARS: Record<string, Parser> = {
    fn: tsxLanguageSupport.language.parser,
    function: tsxLanguageSupport.language.parser,
    expr: tsxLanguageSupport.language.parser,
    expression: tsxLanguageSupport.language.parser,
    md: markdownLanguageSupport.language.parser,
    markdown: markdownLanguageSupport.language.parser,
    css: cssLanguageSupport.language.parser,
    html: htmlLanguageSupport.language.parser,
};

let parserWithMetadata = parser.configure({
    props: [
        indentNodeProp.add({
            SectionDeclaration: continuedIndent(),
            TypeDeclaration: continuedIndent(),
            Object: continuedIndent(),
        }),
        foldNodeProp.add({
            [[Rules.TypeBody, Rules.SectionBody, Rules.Object, Rules.List].join(" ")](tree) {
                return { from: tree.from + 1, to: tree.to - 1 };
            },
            // TODO: fold multiline strings
        }),
        styleTags({
            [`${Rules.LineComment}!`]: t.lineComment,
            "TypeDeclaration/LooseIdentifier!": t.className,
            "ExtendsClause/LooseIdentifier!": t.className,
            "ImportedSymbols/LooseIdentifier!": t.className,
            "AssignmentName!": t.variableName,
            "SectionDeclaration/Identifier!": t.keyword,
            "AssignmentType/Identifier!": t.typeName,

            "String/...": t.string,
            "TaggedString/String/...": t.content,

            "Tag!": t.tagName,
            "Boolean!": t.bool,
            "Number!": t.number,
            "ParameterName!": t.variableName,
            [`${Rules.Null}!`]: t.null,

            "( )": t.paren,
            "{ }": t.brace,
            "[ ]": t.squareBracket,
            "type abstract extends default import from as": t.keyword,
        }),
    ],
    wrap: parseMixed((node: SyntaxNodeRef, input) => {
        if (!node.type.isError && node.name == Rules.String && node.matchContext([Rules.TaggedString])) {
            let syntaxNode = node.node;
            let prevSibling = syntaxNode?.prevSibling;

            let tag = input.read(prevSibling.from, prevSibling.to);
            if (tag in TAGGED_STRING_ISLAND_GRAMMARS) {
                let parser = TAGGED_STRING_ISLAND_GRAMMARS[tag];
                let overlay = trimQuotes(input, node);
                if (!overlay) return null;
                return { parser, overlay: [overlay] };
            }
        }
        return null;
    }),
});

export const ObsidianTypingLanguage = LRLanguage.define({
    parser: parserWithMetadata,
    languageData: {
        commentTokens: {
            line: "//",
        },
        mode: "otl",
        closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
        autocomplete: visitorCompletion,
    },
});

export function ObsidianTypingLanguageSupport() {
    let ext = new LanguageSupport(ObsidianTypingLanguage, [
        tsxLanguageSupport,
        markdownLanguageSupport,
        cssLanguageSupport,
    ]);
    return ext;
}

const autoSavePlugin = (textView: TextFileView) =>
    ViewPlugin.fromClass(
        class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    textView.requestSave();
                }
            }
        }
    );

let panelContainer: HTMLElement;
export function setPanelContent(s: string) {
    if (panelContainer) panelContainer.textContent = s;
}

function statusPanel(view: EditorView): Panel {
    setPanelContent("default");
    if (!panelContainer) panelContainer = document.createElement("div");
    return {
        dom: panelContainer,
    };
}

class BaseEditorView extends TextFileView {
    private view: EditorView;
    navigation = true;

    constructor(leaf: WorkspaceLeaf, private viewType: string, private extensions: Extension[]) {
        super(leaf);
    }

    getViewData(): string {
        let result = this.view.state.doc.toString();
        return result;
    }

    setViewData(data: string, clear: boolean): void {
        if (data == null) {
            return;
        }
        this.view.dispatch(
            this.view.state.update({
                changes: {
                    from: 0,
                    to: this.view.state.doc.length,
                    insert: data,
                },
            })
        );
    }

    async onOpen() {
        this.contentEl.classList.add(styles.codeEditorViewContent);
        let state = EditorState.create({
            extensions: [
                basicSetup,
                obsidianCodeTheme,

                // ref: https://github.com/codemirror/dev/issues/324#issuecomment-1150701071
                tooltips({ position: "absolute" }),
                search(),
                lintGutter(),
                indentUnit.of("    "),
                // showPanel.of(statusPanel), // TODO: disabled until it is configured to show useful information
                keymap.of(
                    defaultKeymap.concat([
                        {
                            key: "Tab",
                            run: moveCompletionSelection(true),
                            shift: moveCompletionSelection(false),
                        },
                        indentWithTab,
                        ...searchKeymap,
                    ])
                ),
                autoSavePlugin(this),
                // scrollPastEnd(), // TODO: disabled as it messes measure loop
                autocompletion(),
                codeEditorMetadataField,
                ...this.extensions,
            ],
        });
        this.view = new EditorView({ state, parent: this.contentEl });

        await super.onOpen();
    }

    async onLoadFile(file: TFile) {
        this.view.dispatch({ effects: setCodeEditorMetadataEffect.of({ path: file.path }) });
        await super.onLoadFile(file);
    }

    clear(): void {
        this.view.destroy();
    }

    async onClose() {
        this.save();
        await super.onClose();
    }

    getViewType() {
        return this.viewType;
    }
}

const VIEWS = {
    otl: [ObsidianTypingLanguageSupport(), lint, decorationsPlugin, hover],
    tsx: [tsxLanguageSupport],
    ts: [tsxLanguageSupport],
    jsx: [javascript({ jsx: true })],
    js: [javascript()],
};

function createEditorKeymap(parent: Scope) {
    let scope = new Scope(parent);
    scope.register(["Meta"], "F", () => {});
    scope.register(["Meta"], "/", () => {});
    return scope;
}

let editorKeymap: Scope = null;

export function registerCodeEditorViews(plugin: TypingPlugin) {
    for (let ext in VIEWS) {
        let languageSupportExtensions = VIEWS[ext as keyof typeof VIEWS];
        let viewType = `editor-view-${ext}`;
        plugin.registerView(viewType, (leaf: WorkspaceLeaf) => {
            return new BaseEditorView(leaf, viewType, languageSupportExtensions);
        });
        plugin.registerExtensions([ext], viewType);
    }
    plugin.registerEvent(
        plugin.app.workspace.on("active-leaf-change", (leaf) => {
            if (leaf.view.getViewType() == "editor-view-otl") {
                if (editorKeymap == null) editorKeymap = createEditorKeymap(plugin.app.scope);
                plugin.app.keymap.pushScope(editorKeymap);
            } else {
                if (editorKeymap != null) plugin.app.keymap.popScope(editorKeymap);
            }
        })
    );
}
