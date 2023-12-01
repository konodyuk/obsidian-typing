import { MarkdownView, Platform, WorkspaceLeaf } from "obsidian";
import { render } from "preact";
import { gctx } from "src/context";
import TypingPlugin from "src/main";
import styles from "src/styles/view-title.scss";
import { ActionSuggestModal } from "src/ui";

const ViewTitle = (props: { prefix: string | null; name: string | null; onNameClick: { (): void } }) => {
    let shouldRenderPrefix = props.prefix && (!Platform.isMobile || !props.name);
    let shouldRenderName = props.name;

    return (
        <div className={`${styles.viewTitle} view-header-title`} onClick={props.onNameClick}>
            {shouldRenderPrefix ? <div className={styles.viewTitlePrefix}>{props.prefix}</div> : {}}
            {shouldRenderName ? <div className={styles.viewTitleName}>{props.name}</div> : {}}
        </div>
    );
};

function addViewActions(view: MarkdownView) {
    let actionsEl = view.containerEl.querySelector(".view-actions") as HTMLElement;
    if (!actionsEl.querySelector(`a.view-action[aria-label="Actions"]`)) {
        view.addAction("layout-grid", "Actions", () => {
            let note = gctx.api.note(view.file.path);
            new ActionSuggestModal(gctx.app, note).open();
        });
    }
}

function setViewTitle(view: MarkdownView) {
    const titleContainerEl = view.containerEl.querySelector(
        ".view-header-title-container .view-header-title"
    ) as HTMLElement;

    let note = gctx.api.note(view.file.path);

    let name = null,
        prefix = null;
    if (note.type?.prefix) {
        let tmp = note.type.prefix.parse(note.fullname);
        name = tmp.name;
        prefix = tmp.prefix;
    } else {
        name = note.fullname;
    }

    let container;

    if (titleContainerEl.classList.contains(styles.viewTitle)) {
        container = titleContainerEl.parentElement;
    } else {
        container = titleContainerEl.createEl("div");
        titleContainerEl.replaceWith(container);
    }

    render(
        <ViewTitle
            prefix={prefix}
            name={name}
            onNameClick={async () => {
                let note = gctx.api.note(view.file.path);

                await note.promptState();
            }}
        ></ViewTitle>,
        container
    );
}

export function registerTitleBarLeafHook(plugin: TypingPlugin) {
    const processLeaf = (leaf: WorkspaceLeaf) => {
        let view = leaf.view;
        if (!(view instanceof MarkdownView)) {
            return;
        }
        addViewActions(view);
        setViewTitle(view);
    };
    const processLeaves = () => {
        plugin.app.workspace.getLeavesOfType("markdown").map(processLeaf);
    };

    plugin.app.workspace.onLayoutReady(processLeaves);

    // TODO: can be disabled, but then name in title bar is not updated on state update
    plugin.registerEvent(plugin.app.workspace.on("layout-change", processLeaves));

    plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", processLeaf));
}
