import { MarkdownView, Platform, WorkspaceLeaf } from "obsidian";
import { Fragment, h, render } from "preact";
import { Component } from "react";
import { ctx } from "src/context";
import TypingPlugin from "src/main";
import { Note } from "src/typing/note";
import { PrefixComponent } from "../components/prefix";
import { openActions } from "../modals/actions";

class ViewTitle extends Component {
    constructor(
        public props: {
            prefix: string | null;
            name: string | null;
            onNameClick: { (): void };
        }
    ) {
        super(props);
    }

    render() {
        let shouldRenderPrefix =
            this.props.prefix && (!Platform.isMobile || !this.props.name);
        let shouldRenderName = this.props.name;

        return (
            <>
                {shouldRenderPrefix ? (
                    <PrefixComponent
                        className="view-header-title typing-view-title-prefix"
                        prefix={this.props.prefix}
                    ></PrefixComponent>
                ) : (
                    {}
                )}
                {shouldRenderName ? (
                    <div
                        className="view-header-title typing-view-title-name"
                        onClick={this.props.onNameClick}
                    >
                        {this.props.name}
                    </div>
                ) : (
                    {}
                )}
            </>
        );
    }
}

function addViewActions(view: MarkdownView) {
    let actionsEl = view.containerEl.querySelector(
        ".view-actions"
    ) as HTMLElement;
    if (!actionsEl.querySelector(`a.view-action[aria-label="Actions"]`)) {
        view.addAction("grid", "Actions", () => {
            openActions(view.file.path);
        });
    }
}

function setViewTitle(view: MarkdownView) {
    let titleContainerEl = view.containerEl.querySelector(
        ".view-header-title-container"
    ) as HTMLElement;

    let note = new Note(view.file.path);

    let name = null,
        prefix = null;
    if (note?.type?.prefix) {
        let tmp = note.type.prefix.split(note.name);
        name = tmp.name;
        prefix = tmp.prefix;
    } else {
        name = note.name;
    }

    while (titleContainerEl.firstChild) {
        titleContainerEl.removeChild(titleContainerEl.firstChild);
    }

    render(
        <ViewTitle
            prefix={prefix}
            name={name}
            onNameClick={async () => {
                let note = new Note(view.file.path);
                let newName = await note.promptName();
                if (newName != null) {
                    await note.rename(newName);
                }
            }}
        ></ViewTitle>,
        titleContainerEl
    );
}

export function registerLeafHook(plugin: TypingPlugin) {
    const processLeaves = () => {
        ctx.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
            if (leaf.view.getViewType() != "markdown") {
                return;
            }
            let view = leaf.view as MarkdownView;

            addViewActions(view);

            // if (note) {
            setViewTitle(view);
            // }
        });
    };

    ctx.app.workspace.onLayoutReady(processLeaves);
    ctx.app.workspace.on("layout-change", processLeaves);
    ctx.plugin.register(() => {
        ctx.app.workspace.off("layout-change", processLeaves);
    });
}
