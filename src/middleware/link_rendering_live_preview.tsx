import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { editorInfoField, editorLivePreviewField, getLinkpath, Plugin, View } from "obsidian";
import ReactDOM from "react-dom";
import { gctx } from "src/context";
import { RenderLink } from "src/utilities";

export class LinkWidget extends WidgetType {
    linkText: string;
    linkDisplay: string;
    constructor(public linkContent: string, public sourcePath: string) {
        super();
        this.linkText = this.linkContent;
        if (this.linkText.contains("|")) {
            this.linkText = this.linkText.split("|", 1)[0];
            this.linkDisplay = this.linkContent.slice(this.linkText.length + 1);
        }
    }
    toDOM(view: EditorView): HTMLElement {
        const container = document.createElement("a");
        container.addClass("internal-link");

        container.onmouseenter = (e) => {
            // ref: https://github.com/nothingislost/obsidian-hover-editor/blob/5df5230895d476f9777281e355d0dea1c577c974/src/main.ts#L266
            let instance = gctx.app.workspace.getActiveViewOfType(View);
            gctx.app.workspace.trigger("hover-link", {
                event: e,
                source: "editor",
                hoverParent: instance,
                targetEl: container,
                linktext: this.linkText,
                sourcepath: (instance.info ?? instance).getFile?.()?.path || "",
            });
        };

        container.onclick = (e) => {
            let instance = gctx.app.workspace.getActiveViewOfType(View);
            let sourcePath = (instance.info ?? instance).getFile?.()?.path || "";
            let newLeaf = e.metaKey || e.ctrlKey;
            gctx.app.workspace.openLinkText(this.linkText, sourcePath, newLeaf);
        };

        let linkPath = getLinkpath(this.linkText);
        let tfile = gctx.app.metadataCache.getFirstLinkpathDest(linkPath, this.sourcePath);
        let path = tfile?.path;

        // if (!path) return;
        // if (!path.endsWith("md")) return;

        let note = gctx.api.note(path ?? linkPath);
        let el = RenderLink({ note, type: note.type, container, linkText: this.linkDisplay });

        ReactDOM.render(el, container);
        return container;
    }
}

const linkPlugin = ViewPlugin.fromClass(
    class implements PluginValue {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            if (!gctx.settings.linksInLivePreview) {
                this.decorations = Decoration.none;
                return;
            }
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (!gctx.settings.linksInLivePreview) {
                this.decorations = Decoration.none;
                return;
            }
            if (!update.state.field(editorLivePreviewField)) {
                this.decorations = Decoration.none;
                return;
            }
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            let state = view.state;

            let sourcePath = state.field(editorInfoField)?.file?.path;

            for (let { from, to } of view.visibleRanges) {
                let start: number = null;
                let end: number = null;
                let contentStart: number = null;
                let contentEnd: number = null;

                syntaxTree(state).iterate({
                    from,
                    to,
                    enter(node) {
                        if (node.type.name.includes("formatting-link-start")) {
                            start = node.from;
                            contentStart = node.to;
                        }
                        if (node.type.name.includes("formatting-link-end") && start != null) {
                            end = node.to;
                            contentEnd = node.from;
                        }
                    },
                    leave(node) {
                        if (
                            start != null &&
                            end != null &&
                            node.type.name.includes("formatting-link-end") &&
                            !(start <= state.selection.main.head && state.selection.main.head <= end)
                        ) {
                            builder.add(
                                start,
                                end,
                                Decoration.replace({
                                    inclusiveStart: false,
                                    inclusiveEnd: false,
                                    widget: new LinkWidget(state.sliceDoc(contentStart, contentEnd), sourcePath),
                                })
                            );
                            start = null;
                            end = null;
                        }
                    },
                });
            }

            return builder.finish();
        }

        destroy() {}
    },
    {
        decorations: (value) => value.decorations,
    }
);

export function registerLinkRenderingLivePreview(plugin: Plugin) {
    plugin.registerEditorExtension([linkPlugin]);
}
