import { transform } from "@babel/standalone";
import { availablePlugins } from "@babel/standalone";

// alternative implementation: produces a 1.2MB bundle (vs 2.3MB), but doesn't work on mobile yet:
// import { transform } from "@babel/core";
// import transformReactJSX from "@babel/plugin-transform-react-jsx";

export const transformReactJSX = availablePlugins["transform-react-jsx"];

export function transpileJSX(source: string): string {
    let options = {
        plugins: [[transformReactJSX, { pragma: "h", pragmaFrag: "Fragment" }]],
    };
    let result = transform(source, options);
    return result.code;
}
