import { availablePlugins, transform } from "@babel/standalone";
import { customImportExportTransform } from "./transform";

const transformReactJSX = availablePlugins["transform-react-jsx"];
const transformModulesCommonJS = availablePlugins["transform-modules-commonjs"];

interface TranspilationError {
    message: string;
    stack?: string;
}

type TranspilationResult = {
    code?: string;
    errors?: Array<TranspilationError>;
};

const removeUseStrict = {
    visitor: {
        Directive(path: any) {
            if (path.node.value.value === "use strict") {
                path.remove();
            }
        },
    },
};

const DEFAULT_TRANSPILE_OPTIONS = {
    plugins: [
        customImportExportTransform,
        [transformReactJSX, { pragma: "h", pragmaFrag: "Fragment" }],
        transformModulesCommonJS,
        removeUseStrict,
    ],
    parserOpts: {
        allowReturnOutsideFunction: true,
    },
    filename: "file.tsx",
};

export function transpile(source: string, options = DEFAULT_TRANSPILE_OPTIONS): TranspilationResult {
    try {
        let result = transform(source, options);
        return { code: result.code };
    } catch (e) {
        return {
            errors: [{ message: e.message, stack: e.stack }],
        };
    }
}

export function compileModuleWithContext(
    code: string,
    context: Record<string, any> = {},
    options: { transpile: boolean; filename?: string } = { transpile: true }
): Record<string, any> {
    if (options.transpile) {
        let transpiled = transpile(code);
        if (transpiled.errors != null) {
            throw transpiled.errors[0];
        }
        code = transpiled.code;
    }

    const exports = {};

    const contextNames = Object.keys(context);

    // Use Function constructor to create a function
    const createModule = new Function("exports", ...contextNames, `${code}\n//# sourceURL=${options.filename}`);

    // Run the function to populate the exports object
    createModule(exports, ...contextNames.map((name) => context[name]));

    return exports;
}

export function compileFunctionWithContext(
    code: string,
    context: Record<string, any> = {},
    args: string[] = ["ctx", "note"],
    options: { transpile: boolean } = { transpile: true }
): Function | TranspilationError {
    if (options.transpile) {
        let transpiled = transpile(code);
        if (transpiled.errors) {
            return transpiled.errors[0];
        }
        code = transpiled.code;
    }

    const contextNames = Object.keys(context);

    const fn = new Function(...contextNames, ...args, code);

    try {
        return partial(fn, ...contextNames.map((name) => context[name]));
    } catch (e) {
        return { message: e.message };
    }
}

function partial(fn: Function, ...args: any[]) {
    return function (...newArgs: any[]) {
        return fn.apply(null, args.concat(newArgs));
    };
}
