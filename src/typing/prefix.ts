import { Platform, TFile, TFolder } from "obsidian";
import { DataClass, field } from "src/utilities";
import type { NoteState, Type } from ".";

// TODO: executable interpolation
// Usage:
// prefix = "str-${api.import('file').}"
export class Prefix extends DataClass {
    @field()
    template: string;

    regex: RegExp;
    interpolations: (PrefixInterpolationSpec & { params: string })[] = [];

    onAfterCreate(): void {
        let result = "^" + this.template;
        let interpolationMatches = Array.from(this.template.matchAll(/\{([^}]+)\}/g));

        for (let match of interpolationMatches) {
            const wholeMatch = match[0];
            const [name, params] = match[1].split(":");
            let interpolation = INTERPOLATIONS.find((i) => i.name === name);
            if (!interpolation) {
                throw new Error(`Interpolation '${name}' not found`);
            }

            this.interpolations.push({ ...interpolation, params });
            result = result.replace(wholeMatch, `(${interpolation.regex(params)})`);
        }

        this.regex = new RegExp(result);
    }

    parse(name: string) {
        let match = this.regex.exec(name);
        if (!match) {
            return { prefix: "", name: name, interpolations: [] };
        }

        let prefixEnd = match[0].length;
        let interpolations = match.slice(1);

        if (prefixEnd == name.length) {
            return { prefix: name, name: "", interpolations };
        }

        // prefix must be followed by whitespace
        // TODO: must it really?
        if (name[prefixEnd] != " ") {
            return { prefix: "", name: name, interpolations: [] };
        }

        let prefix = name.slice(0, prefixEnd).trim();
        let significantName = name.slice(prefixEnd).trim();
        return { prefix: prefix, name: significantName, interpolations };
    }

    apply(args: { type: Type; state: NoteState; cdate: Date }) {
        let result = this.template;
        for (let [index, interpolation] of this.interpolations.entries()) {
            result = result.replace(
                `{${interpolation.name}${interpolation.params ? ":" + interpolation.params : ""}}`,
                interpolation.fn({ ...args, params: interpolation.params, index })
            );
        }
        return result;
    }
}

interface PrefixInterpolationSpec {
    name: string;
    fn: (args: { params: string; type: Type; state: NoteState; cdate: Date; index: number }) => string;
    regex: (params?: string) => string;
    // extractor?: (value: string, type: Type, state: NoteState, cdate: Date) => string;
}

export let INTERPOLATIONS: PrefixInterpolationSpec[] = [
    {
        name: "date_compact",
        regex: () => "[0-9A-Za-z]+[0-9A-C]{1}[0-9A-V]{1}[0-9A-N]{1}[0-9A-Za-x]{2}",
        fn: ({ cdate }) => {
            const B62_RANGE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

            let result = "";
            let year = cdate.getFullYear() - 2000;
            while (true) {
                result = B62_RANGE[year % 62] + result;
                year = ~~(year / 62);
                if (year == 0) {
                    break;
                }
            }

            result += B62_RANGE[cdate.getMonth() + 1];
            result += B62_RANGE[cdate.getDate()];
            result += B62_RANGE[cdate.getHours()];
            result += B62_RANGE[cdate.getMinutes()];
            result += B62_RANGE[cdate.getSeconds()];
            return result;
        },
    },
    {
        name: "date",
        regex: () => "[0-9A-Za-z]+[0-9A-C]{1}[0-9A-V]{1}[0-9A-N]{1}[0-9A-Za-x]{2}",
        fn: ({ cdate }) => {
            // TODO: format according to args
            return cdate.toISOString();
        },
    },
    {
        name: "serial",
        regex: () => "[1-9]+[0-9]*",
        fn: ({ type, index }) => {
            let max = 0;
            let folder = app.vault.getAbstractFileByPath(type.folder);
            if (folder == null) {
                // numeration starts with 1
                return `${max + 1}`;
            }
            if (!(folder instanceof TFolder)) {
                return;
            }
            for (let child of folder.children) {
                if (!(child instanceof TFile)) {
                    continue;
                }
                let filename = child.basename;
                let { interpolations } = type.prefix.parse(filename);
                if (!interpolations?.length) continue;
                let value = +interpolations[index];
                max = Math.max(max, value);
            }
            return `${max + 1}`;
        },
    },
];

export function registerPrefixInterpolation(spec: PrefixInterpolationSpec) {
    INTERPOLATIONS.push(spec);
}
