import { Component, MarkdownRenderer } from "obsidian";
import { createContext, memo, useContext, useEffect, useRef } from "react";

interface MarkdownRenderingContextType {
    sourcePath: string;
    component: Component;
}

export const MarkdownRenderingContext = createContext<MarkdownRenderingContextType | null>(null);

export const Markdown = memo(
    ({ text, children, compact }: { text?: string; children?: string; compact?: boolean }) => {
        let containerRef = useRef<HTMLElement>();
        text = text ?? children;

        let context = useContext(MarkdownRenderingContext);

        useEffect(() => {
            if (!containerRef.current) return;
            if (containerRef.current.firstChild) return;
            MarkdownRenderer.renderMarkdown(text, containerRef.current, context?.sourcePath, context?.component).then(
                () => {
                    if (!compact) return;
                    // ref: https://github.com/blacksmithgu/obsidian-dataview/blob/master/src/ui/markdown.tsx
                    let container: HTMLElement = containerRef.current;
                    let paragraph = container.querySelector(":scope > p");
                    if (container.children.length == 1 && paragraph) {
                        while (paragraph.firstChild) {
                            container.appendChild(paragraph.firstChild);
                        }
                        container.removeChild(paragraph);
                    }
                }
            );
        }, [text, containerRef.current]);

        if (compact) {
            return (
                <span
                    key={text}
                    ref={(el) => {
                        containerRef.current = el;
                    }}
                />
            );
        } else {
            return (
                <div
                    key={text}
                    ref={(el) => {
                        containerRef.current = el;
                    }}
                />
            );
        }
    },
    (prevProps, nextProps) => {
        let textEqual = prevProps.text == nextProps.text;
        let childrenEqual = prevProps.children == nextProps.children;
        return textEqual || childrenEqual;
    }
);
