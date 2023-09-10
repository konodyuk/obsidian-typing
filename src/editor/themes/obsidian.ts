import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { StyleSpec } from "style-mod";

let headingStyles = [];
for (let i = 1; i <= 6; i++) {
    headingStyles.push({
        // @ts-expect-error
        tag: t[`heading${i}`],
        color: `var(--h${i}-color)`,
        fontWeight: `var(--h${i}-weight)`,
        fontStyle: `var(--h${i}-style)`,
        // fontSize: `var(--h${i}-size)`,
    });
}

const obsidianEditorTheme = (overrides: StyleSpec, isDark: boolean = false) =>
    EditorView.theme(
        {
            "&": {
                backgroundColor: "var(--background-primary)",
                height: "100%",
            },
            ".cm-scroller": {
                fontFamily: "var(--font-monospace)",
            },
            "&, .cm-tooltip, .cm-panels": {
                color: "var(--text-normal)",
            },
            ".cm-placeholder": {
                color: "var(--text-faint)",
            },
            "&.cm-focused": {
                outline: "unset",
            },
            "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
                { backgroundColor: "var(--background-modifier-hover)" },
            ".cm-gutters": {
                backgroundColor: "var(--background-secondary)",
                color: "var(--text-muted)",
                border: "unset",
            },
            ".cm-lineNumbers": {
                minWidth: "var(--size-4-8)",
            },
            ".cm-content": {
                caretColor: "var(--caret-color)",
            },
            ".cm-cursor, .cm-dropCursor": {
                borderLeftColor: "var(--caret-color)",
            },
            ".cm-tooltip": {
                border: "1px solid var(--background-modifier-border)",
                backgroundColor: "var(--background-secondary)",
                borderRadius: "var(--radius-s)",
                // overflow: "hidden", // also hides tooltip info
            },
            ".cm-tooltip .cm-tooltip-arrow:before": {
                borderTopColor: "transparent",
                borderBottomColor: "transparent",
            },
            ".cm-tooltip .cm-tooltip-arrow:after": {
                borderTopColor: "var(--background-secondary)",
                borderBottomColor: "var(--background-secondary)",
            },
            ".cm-tooltip-autocomplete": {
                "& > ul > li[aria-selected]": {
                    backgroundColor: "var(--background-modifier-hover)",
                },
            },
            ".cm-panels": { backgroundColor: "var(--background-secondary)", fontFamily: "var(--font-interface)" },
            ".cm-panels .cm-panel.cm-panel-lint ul [aria-selected]": {
                backgroundColor: "var(--background-modifier-hover)",
            },
            ".cm-panels.cm-panels-top": { borderBottom: "2px solid var(--background-modifier-border)" },
            ".cm-panels.cm-panels-bottom": { borderTop: "2px solid var(--background-modifier-border)" },
            ...overrides,
        },
        { dark: isDark }
    );

const obsidianThemeHighlighting = HighlightStyle.define([
    { tag: t.comment, color: "var(--code-comment)" },
    { tag: t.variableName, color: "var(--text-normal)" },
    { tag: [t.string, t.special(t.brace)], color: "var(--code-string)" },
    { tag: t.number, color: "var(--code-value)" },
    { tag: t.bool, color: "var(--code-value)" },
    { tag: t.null, color: "var(--code-value)" },
    { tag: t.keyword, color: "var(--code-keyword)" },
    { tag: t.operator, color: "var(--code-operator)" },
    { tag: t.className, color: "var(--code-important)" },
    { tag: t.definition(t.typeName), color: "var(--code-important)" },
    { tag: t.typeName, color: "var(--code-important)" },
    { tag: t.angleBracket, color: "var(--code-operator)" },
    { tag: t.tagName, color: "var(--code-tag)" },
    { tag: t.attributeName, color: "var(--code-property)" },

    { tag: t.strong, color: "var(--bold-color)", fontWeight: "var(--bold-weight)" },
    { tag: t.emphasis, color: "var(--italic-color)", fontStyle: "italic" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    ...headingStyles,
]);

export const obsidianCodeTheme: Extension = [
    obsidianEditorTheme(
        {
            // no active line because it conflicts with selection
            // patch available only in 6.11.0
            // ref: https://github.com/codemirror/view/commit/4810ba4733a97e6c7d00af397e675e2b9ec8f184
            ".cm-activeLine": {
                // backgroundColor: "var(--background-modifier-hover)",
                // backgroundColor: "var(--background-primary-alt)",
                backgroundColor: "unset",
            },
            ".cm-activeLineGutter": {
                // backgroundColor: "var(--background-modifier-hover)",
                // backgroundColor: "var(--background-primary-alt)",
                backgroundColor: "unset",
            },
        },
        true
    ),
    syntaxHighlighting(obsidianThemeHighlighting),
];

export const obsidianMarkdownTheme: Extension = [
    obsidianEditorTheme({
        "&.cm-editor .cm-scroller": {
            fontFamily: "var(--font-text)",
        },
        ".cm-activeLine": {
            backgroundColor: "unset",
        },
        ".cm-line": {
            padding: "unset",
        },
    }),
    syntaxHighlighting(obsidianThemeHighlighting),
];
