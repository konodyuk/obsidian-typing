import createCache, { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import React from "react";
import ReactDOM from "react-dom";
import { log } from "src/utilities";

type ContextProvider = React.ComponentType<{ children: React.ReactNode }>;

let emotionCache: EmotionCache;
let contextProviders: ContextProvider[] = [];

export function registerContextProvider(component: ContextProvider) {
    contextProviders.push(component);
}

export function render(element: React.ReactNode, container: Element) {
    for (let Provider of contextProviders) {
        element = <Provider>{element}</Provider>;
    }

    if (React.isValidElement(element)) {
        return ReactDOM.render(element, container);
    } else {
        log.error("Attempted to render a non-element", { element, container });
    }
}

const EmotionCacheProvider = (props: { children: React.ReactNode }) => {
    if (!emotionCache) {
        emotionCache = createCache({
            key: "typing-custom-key",
            container: document.head.createDiv(),
        });
    }

    return <CacheProvider value={emotionCache}>{props.children}</CacheProvider>;
};

registerContextProvider(EmotionCacheProvider);
