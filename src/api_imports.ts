import { gctx } from "./context";

export async function importModules() {
    if (gctx.testing) return {};
    return {
        react: await import("react"),
        "react-dom": await import("react-dom"),
        preact: await import("preact"),
        "@emotion/styled": await import("@emotion/styled"),
        "@emotion/react": await import("@emotion/react"),
        "@emotion/css": await import("@emotion/css"),
    };
}
