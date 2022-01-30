import { Component, MarkdownRenderer } from "obsidian";
import { h } from "preact";

export function createMarkdownRenderingContext(
    containerDefault: HTMLElement,
    notePathDefault: string
) {
    async function renderMarkdown(
        source: string,
        container?: HTMLElement,
        notePath?: string,
        component: Component = null
    ) {
        if (!container) {
            container = containerDefault;
        }
        if (!notePath) {
            notePath = notePathDefault;
        }

        let subcontainer = container.createSpan();
        await MarkdownRenderer.renderMarkdown(
            source,
            subcontainer,
            notePath,
            component
        );

        let par = subcontainer.querySelector("p");
        if (subcontainer.children.length == 1 && par) {
            while (par.firstChild) {
                subcontainer.appendChild(par.firstChild);
            }
            subcontainer.removeChild(par);
        }
    }

    const Markdown = ({ text, children }: { text: string; children: any }) => {
        if (children) {
            text = children;
        }
        return (
            <span
                ref={(el) => {
                    renderMarkdown(text, el);
                }}
            ></span>
        );
    };

    return {
        renderMarkdown: renderMarkdown,
        markdown: renderMarkdown,
        md: renderMarkdown,
        Markdown: Markdown,
        Md: Markdown,
    };
}
