import { buildParserFile } from "@lezer/generator";
import chokidar from "chokidar";
import fs from "fs";

const generateParser = async (grammarFile, parserFile) => {
    console.log("LEZER: generate parser");
    const grammar = fs.readFileSync(grammarFile, "utf-8");
    const { parser, terms } = buildParserFile(grammar, {
        moduleStyle: "cjs",
    });
    fs.writeFileSync(parserFile, parser);
};

const generateRulesEnum = async (parserFile, rulesFile) => {
    console.log("LEZER: generate rules enum");
    const enumName = "Rules";
    let enumContent = `export enum ${enumName} {\n`;

    let { parser } = await import(parserFile);

    let rules = parser.nodeSet.types.map((x) => x.name).filter((x) => /^[A-Z]/.test(x));

    for (const name of rules) {
        enumContent += `    ${name} = "${name}",\n`;
    }

    enumContent += "}\n";
    fs.writeFileSync(rulesFile, enumContent);
};

export const lezerPlugin = (grammarFile, watch) => {
    const parserFile = grammarFile.replace(/(\.[^\.]+)$/, "_parser.js");
    const rulesFile = grammarFile.replace(/(\.[^\.]+)$/, "_parser.rules.ts");

    const buildLezer = () => {
        generateParser(grammarFile, parserFile);
        generateRulesEnum(parserFile, rulesFile);
    };

    return {
        name: "lezer-plugin",
        setup(build) {
            console.log("setup", build.initialOptions.watch, build.initialOptions, build);
            build.onStart(buildLezer);

            if (watch) {
                chokidar.watch(grammarFile).on("change", buildLezer);
            }
        },
    };
};
