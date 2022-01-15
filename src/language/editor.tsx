import { loadPrism, TextFileView, WorkspaceLeaf } from "obsidian";
import { Fragment, h, render } from "preact";
import React from "react";
import Editor from "react-simple-code-editor";
import { ctx } from "src/context";
import TypingPlugin from "src/main";
import styled from "styled-components";
import { compile } from "./grammar";

const MIN_VALIDATION_INTERVAL = 1000;

interface Annotation {
    row: number;
    column: number;
    type: "error" | "info";
    message: string;
}

const LineNumber = ({
    lineNumber,
    annotation,
}: {
    lineNumber: number;
    annotation?: Annotation;
}) => {
    let className = "otl-line-number";
    let tooltip = null;

    if (annotation) {
        className += ` otl-line-number-${annotation.type}`;
        tooltip = (
            <span className="otl-line-number-tooltip">
                {annotation.message}
            </span>
        );
    }
    return (
        <span className={className}>
            {lineNumber}
            {tooltip}
        </span>
    );
};

const Gutter = ({
    annotations,
    lineCount,
}: {
    annotations: Array<Annotation>;
    lineCount: number;
}) => {
    let lines = [];
    let lineToAnnotation: Record<number, Annotation> = {};
    for (let annotation of annotations) {
        lineToAnnotation[annotation.row] = annotation;
    }
    for (let line = 1; line <= lineCount; line++) {
        lines.push(
            <LineNumber lineNumber={line} annotation={lineToAnnotation[line]} />
        );
    }
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                marginRight: "1em",
            }}
        >
            {lines}
        </div>
    );
};

const EditorContainer = styled.div`
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: row;

    & pre,
    & textarea {
        white-space: pre !important;
    }
`;

class CodeEditorComponent extends React.Component {
    ref: any;
    state: {
        content: string;
        annotations: Array<Annotation>;
    };
    constructor(
        public props: {
            content: string;
            onChangeCallback: { (content: string): void };
        }
    ) {
        super(props);
        this.state = {
            content: props.content,
            annotations: [],
        };
    }

    setContent(content: string) {
        this.setState({ content: content });
    }

    getContent(): string {
        return this.state.content;
    }

    render() {
        return (
            // additional div for full height
            // URL: https://github.com/satya164/react-simple-code-editor/issues/63#issuecomment-843406191
            <EditorContainer
                onClick={() => {
                    // focus on text area
                    this.ref._input.focus();
                }}
            >
                <Gutter
                    annotations={this.state.annotations}
                    lineCount={this.state.content.split("\n").length}
                />
                <div style={{ width: "fit-content" }}>
                    <Editor
                        value={this.state.content}
                        onValueChange={this.onValueChange}
                        ref={(ref: any) => {
                            this.ref = ref;
                        }}
                        id="typing-code-editor"
                        highlight={(code: string) => this.highlight(code)}
                        padding={0}
                        spellCheck={"false"}
                        style={{
                            fontFamily: "var(--font-monospace)",
                        }}
                        tabSize={4}
                    />
                </div>
            </EditorContainer>
        );
    }

    onValueChange = (code: string) => {
        this.setState({ content: code });
    };

    highlight(code: string) {
        return code;
    }
}

export class JSXEditorComponent extends CodeEditorComponent {
    highlight(code: string) {
        return ctx.prism.highlight(code, ctx.prism.languages.jsx);
    }
}

export class OTLEditorComponent extends CodeEditorComponent {
    canValidate: boolean = true;
    shouldValidate: boolean = false;

    onValueChange = (code: string) => {
        this.setState({ content: code });
        this.requestValidation();
        this.props.onChangeCallback(code);
    };

    highlight(code: string) {
        return ctx.prism.highlight(code, ctx.prism.languages.otl);
    }

    requestValidation() {
        if (this.canValidate) {
            this.shouldValidate = false;
            setTimeout(() => {
                this.validate(this.state.content);
            }, 100);
            this.canValidate = false;

            setTimeout(() => {
                this.canValidate = true;
                if (this.shouldValidate) {
                    this.requestValidation();
                }
            }, MIN_VALIDATION_INTERVAL);
        } else {
            this.shouldValidate = true;
        }
    }

    validate(code: string) {
        let result = compile(code);

        if (result.status == false) {
            if (result.error && result.index) {
                this.setState({
                    annotations: [
                        {
                            row: result.index.line,
                            column: result.index.column,
                            type: "error",
                            message: result.error,
                        },
                    ],
                });
            }
        } else {
            ctx.setRegistry(result.registry);
            this.setState({
                annotations: [],
            });
        }
    }
}

export const OTL_EDITOR_VIEW_TYPE = "otl-editor-view";
export const JSX_EDITOR_VIEW_TYPE = "jsx-editor-view";

abstract class CodeEditorView<
    T extends CodeEditorComponent
> extends TextFileView {
    editor: React.RefObject<T>;

    constructor(leaf: WorkspaceLeaf, public type: new (...args: any[]) => T) {
        super(leaf);
        this.editor = React.createRef<T>();
    }

    getViewData(): string {
        return this.editor.current.getContent() || "";
    }

    setViewData(data: string, clear: boolean): void {
        if (data == null) {
            return;
        }
        if (this.editor.current) {
            this.editor.current.setContent(data);
        }
    }

    async onOpen() {
        render(
            <this.type
                // @ts-ignore
                ref={this.editor}
                content={""}
                onChangeCallback={(s: string) => {
                    this.requestSave();
                }}
            />,
            this.contentEl
        );
    }

    clear(): void {}

    async onClose() {
        ctx.plugin.setSchemaReloader();
    }
}

export class JSXEditorView extends CodeEditorView<JSXEditorComponent> {
    getViewType() {
        return JSX_EDITOR_VIEW_TYPE;
    }
}

export class OTLEditorView extends CodeEditorView<OTLEditorComponent> {
    getViewType() {
        return OTL_EDITOR_VIEW_TYPE;
    }

    async onOpen() {
        ctx.plugin.resetSchemaReloader();
        super.onOpen();
    }

    async onClose() {
        ctx.plugin.setSchemaReloader();
    }
}

export function registerOTLEditorView(plugin: TypingPlugin) {
    plugin.registerView(OTL_EDITOR_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
        return new OTLEditorView(leaf, OTLEditorComponent);
    });
    plugin.registerExtensions(["otl"], OTL_EDITOR_VIEW_TYPE);
}

export function registerJSXEditorView(plugin: TypingPlugin) {
    plugin.registerView(JSX_EDITOR_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
        return new JSXEditorView(leaf, JSXEditorComponent);
    });
    plugin.registerExtensions(["js", "jsx"], JSX_EDITOR_VIEW_TYPE);
}

export async function registerPrism(plugin: TypingPlugin) {
    let prism = await loadPrism();

    setOTLPrismHighlighting(prism);

    ctx.setPrism(prism);
}

function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setOTLPrismHighlighting(prism: any) {
    prism.languages.otl = {
        "class-name": {
            pattern: /((?:type|extends)\s*){1}".*?"(,{1}\s*".*?")*/,
            lookbehind: true,
            inside: {
                punctuation: /[.,\\]/,
            },
        },
        string: {
            pattern: /""".*?"""|".*?"/s,
            greedy: true,
        },
        function: /\b\w+(?=\()/,
        keyword:
            /\b(?:type|extends|folder|icon|prefix|fields|actions|settings|appearance|header|footer|script|initializer|link|abstract|default|pinned)\b/,
        boolean: /\b(?:false|true)\b/,
        number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
        operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
        punctuation: /[{}[\];(),.:]/,
    };

    let inlineMarkdown = prism.languages.extend("markdown", {
        // disable 4-spaces syntax for code blocks
        code: [
            {
                // ```optional language
                // code block
                // ```
                pattern: /^```[\s\S]*?^```$/m,
                greedy: true,
                inside: {
                    "code-block": {
                        pattern:
                            /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
                        lookbehind: true,
                    },
                    "code-language": {
                        pattern: /^(```).+/,
                        lookbehind: true,
                    },
                    punctuation: /```/,
                },
            },
        ],
    });

    prism.languages.insertBefore("otl", "string", {
        "script-string": {
            pattern: /(jsxscript|script){1}\({1}((""".*?""")|(".*?")){1}\){1}/s,
            greedy: true,
            inside: {
                "script-prefix": {
                    pattern: /^(jsxscript|script){1}\({1}("""|"){1}/,
                    inside: {
                        punctuation: /[\("]/,
                        function: /^(jsxscript|script){1}/,
                    },
                },
                "script-postfix": {
                    pattern: /("""|"){1}\){1}$/,
                    alias: "punctuation",
                },
                rest: prism.languages.jsx,
            },
        },

        "markdown-string": {
            pattern: /(markdown){1}\({1}((""".*?""")|(".*?")){1}\){1}/s,
            greedy: true,
            inside: {
                "markdown-prefix": {
                    pattern: /^(markdown){1}\({1}("""|"){1}/,
                    inside: {
                        "markdown-function": {
                            pattern: /^(markdown){1}\({1}/,
                            alias: "function",
                        },
                    },
                },
                "markdown-postfix": {
                    pattern: /("""|"){1}\){1}$/,
                    alias: "punctuation",
                },
                rest: inlineMarkdown,
            },
        },
    });
}
