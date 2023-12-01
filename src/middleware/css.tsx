import { MarkdownView, WorkspaceLeaf } from "obsidian";
import { gctx } from "src/context";
import TypingPlugin from "src/main";

const VIEW_CONTAINER_SELECTORS = [".markdown-preview-view", ".markdown-source-view"];

let leafToClasses: Record<string, string[]> = {};

const processLeaf = (leaf: WorkspaceLeaf) => {
    let view = leaf.view;
    if (!(view instanceof MarkdownView)) {
        return;
    }

    let note = gctx.api.note(view.file.path);

    let newClasses = note?.type?.style?.css_classes ?? [];
    let dynamicCss = note?.type?.style?.css;
    if (dynamicCss) {
        newClasses.push(gctx.userDefinedCssManager.emotion.css`${dynamicCss}`);
    }
    let appliedClasses = leafToClasses[leaf.id] ?? [];

    let classesToRemove = appliedClasses.filter((x) => !newClasses.includes(x));
    let classesToAdd = newClasses.filter((x) => !appliedClasses.includes(x));

    leafToClasses[leaf.id] = newClasses;

    for (let selector of VIEW_CONTAINER_SELECTORS) {
        if (classesToRemove) view.contentEl.querySelector(selector).removeClasses(classesToRemove);
        if (classesToAdd) view.contentEl.querySelector(selector).addClasses(classesToAdd);
    }
};

export function registerCssClassesHook(plugin: TypingPlugin) {
    const processLeaves = () => {
        plugin.app.workspace.getLeavesOfType("markdown").map(processLeaf);
    };

    plugin.app.workspace.onLayoutReady(processLeaves);

    plugin.registerEvent(plugin.app.metadataCache.on("typing:schema-change", processLeaves));
    plugin.registerEvent(plugin.app.workspace.on("layout-change", processLeaves));
    plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", processLeaf));
}
