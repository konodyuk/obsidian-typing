import {
    Extension,
    RangeSetBuilder,
    StateField,
    Transaction,
} from '@codemirror/state';
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType,
} from '@codemirror/view';
import { Component, editorInfoField, editorLivePreviewField, livePreviewState, MarkdownEditView, MarkdownSubView, MarkdownView, Plugin } from 'obsidian';
import { MarginalRenderChild } from './marginal_rendering';
import { gctx } from 'src/context';

class MarginalWidget extends WidgetType {
    constructor(public ctx: Component, public sourcePath: string, public marginalType: "header" | "footer") {
        super();
    }

    updateDOM(dom: HTMLElement, view: EditorView): boolean {
        // Avoid continuously recreating the embedded content on every editor keystroke.
        // The MarginalRenderChild already implements the necessary conditional
        // auto-refresh of its contents when the base data changes.
        return true;
    }

    toDOM(view: EditorView): HTMLElement {
        let embedEl = document.createElement("div");
        embedEl.addClasses(["cm-embed-block", "markdown-rendered"]);

        let containerEl = document.createElement("div");
        containerEl.addClass(`typing-${this.marginalType}`);
        embedEl.appendChild(containerEl);

        this.ctx.addChild(new MarginalRenderChild(containerEl, this.sourcePath, this.marginalType));
        return embedEl;
    }
}

export const marginalDecorationsField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        return Decoration.none;
    },
    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        if (!gctx.settings.marginalsInLivePreview) {
            return Decoration.none;
        }

        if (!transaction.state.field(editorLivePreviewField)) {
            return Decoration.none;
        }

        const builder = new RangeSetBuilder<Decoration>();
        const editorInfo = transaction.state.field(editorInfoField)
        const sourcePath = editorInfo?.file?.path;
        const markdownView = editorInfo instanceof MarkdownView ? editorInfo as MarkdownView : null;

        if (!markdownView) {
            return Decoration.none;
        }

        // Insert header before the actual note content
        const headerPos = 0;

        builder.add(headerPos, headerPos, Decoration.widget({
            widget: new MarginalWidget(markdownView, sourcePath, "header"),
            block: true,
            side: -10000,
        }));

        // Insert footer after the actual note content
        let footerPos = transaction.state.doc.length;

        builder.add(footerPos, footerPos, Decoration.widget({
            widget: new MarginalWidget(markdownView, sourcePath, "footer"),
            block: true,
            side: 10000,
        }));

        return builder.finish();
    },
    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field);
    },
});

export function registerMarginalRenderingLivePreview(plugin: Plugin) {
    plugin.registerEditorExtension([marginalDecorationsField]);
}
