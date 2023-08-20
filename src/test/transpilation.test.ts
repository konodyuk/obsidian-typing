import { customImportExportTransform } from "src/scripting/transform";
import { transpile } from "src/scripting/transpilation";

function trimWhiteSpace(s: string) {
    return s.replace(/\s+/g, "");
}

function testTranspilation(from: string, to: string) {
    let result = transpile(from, { plugins: [customImportExportTransform] });
    if (result.errors) {
        throw result.errors[0];
    }

    let transpiled = result.code;

    expect(transpiled).not.toBeUndefined();

    transpiled = trimWhiteSpace(transpiled);
    to = trimWhiteSpace(to);

    expect(transpiled).toEqual(to);
}

test("imports", () => {
    testTranspilation(
        `import {A, B} from "path/to/file.ts"`,
        `const {A, B} = api._import_explicit("path/to/file.ts", ["A", "B"]);`
    );
    testTranspilation(
        `import NS from "path/to/file.ts"`,
        `const {default: NS} = api._import_explicit("path/to/file.ts", ["default"]);`
    );
    testTranspilation(
        `import NS, {A, B} from "path/to/file.ts"`,
        `const {default: NS, A, B} = api._import_explicit("path/to/file.ts", ["default", "A", "B"]);`
    );
    testTranspilation(
        `import * as NS from "path/to/file.ts"`,
        `const {__star__: NS} = api._import_explicit("path/to/file.ts", ["__star__"]);`
    );
    testTranspilation(
        `import Default, * as NS from "path/to/file.ts"`,
        `const {default: Default, __star__:NS} = api._import_explicit("path/to/file.ts", ["default", "__star__"]);`
    );
    testTranspilation(
        `import { A as Alpha, B as Bravo } from "path/to/file.ts";`,
        `const {A: Alpha, B: Bravo} = api._import_explicit("path/to/file.ts", ["A", "B"]);`
    );
    testTranspilation(
        `import Default, { A as Alpha, B as Bravo } from "path/to/file.ts";`,
        `const {default: Default, A: Alpha, B: Bravo} = api._import_explicit("path/to/file.ts", ["default", "A", "B"]);`
    );
});

test("exports", () => {
    testTranspilation(
        `export {A, B} from "path/to/file.ts"`,
        `export const {A, B} = api._import_explicit("path/to/file.ts", ["A", "B"]);`
    );
    // testTranspilation(
    //     `export NS from "path/to/file.ts"`,
    //     `export const {default: NS} = api._import_explicit("path/to/file.ts", ["default"]);`
    // );
    // testTranspilation(
    //     `export NS, {A, B} from "path/to/file.ts"`,
    //     `export const {default: NS, A, B} = api._import_explicit("path/to/file.ts", ["default", "A", "B"]);`
    // );
    // testTranspilation(
    //     `export * as NS from "path/to/file.ts"`,
    //     `export const {__star__: NS} = api._import_explicit("path/to/file.ts", ["__star__"]);`
    // );
    // testTranspilation(
    //     `export { A as Alpha, B as Bravo } from "path/to/file.ts";`,
    //     `export const {A: Alpha, B: Bravo} = api._import_explicit("path/to/file.ts", ["A", "B"]);`
    // );
});
