import { Type } from "./type";

interface PrefixProvider {
    (
        type: Type,
        name: string,
        fields: { [name: string]: string },
        prefix: Prefix
    ): string;
    regex?: string;
}

export class Prefix {
    static providers: { [name: string]: PrefixProvider } = {};
    regex: RegExp;
    constructor(public format: string) {}
    static fromString(format: string): Prefix {
        let result = new this(format);
        let regex = "^" + format;
        for (let providerName in this.providers) {
            regex = regex.replace(
                `{${providerName}}`,
                this.providers[providerName].regex
            );
        }
        result.regex = RegExp(regex);
        return result;
    }
    splitByPrefix(name: string): { prefix: string; name: string } {
        let match = this.regex.exec(name);
        if (!match) {
            return { prefix: "", name: name };
        }
        let prefix = name.slice(0, match[0].length).trim();
        let significantName = name.slice(match[0].length).trim();
        return { prefix: prefix, name: significantName };
    }
    static registerProvider(
        name: string,
        regex: string,
        callback: PrefixProvider
    ) {
        this.providers[name] = callback;
        this.providers[name].regex = regex;
    }
    exec(args: { [key: string]: string }) {
        let result = this.format;
        for (let key in args) {
            result = result.replace(`{${key}}`, args[key]);
        }
        return result;
    }
    new(type: Type, name: string, fields: { [name: string]: string }): string {
        let result = this.format;
        for (let providerName in Prefix.providers) {
            console.log("result", result, "provider", providerName);
            result = result.replace(
                `{${providerName}}`,
                Prefix.providers[providerName](type, name, fields, this)
            );
        }
        console.log("result", result);
        return result;
    }
}

const b62range =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

Prefix.registerProvider(
    "date_compact",
    "[0-9A-Za-z]+[0-9A-C]{1}[0-9A-V]{1}[0-9A-N]{1}[0-9A-Za-x]{2}\\s*",
    (type, name, fields, prefix) => {
        let result = "";
        let date = new Date();
        let year = date.getFullYear() - 2000;
        while (true) {
            result = b62range[year % 62] + result;
            year = ~~(year / 62);
            if (year == 0) {
                break;
            }
        }

        result += b62range[date.getMonth() + 1];
        result += b62range[date.getDate()];
        result += b62range[date.getHours()];
        result += b62range[date.getMinutes()];
        result += b62range[date.getSeconds()];
        return result;
    }
);

Prefix.registerProvider(
    "serial",
    "[1-9]+[0-9]*\\s*",
    (type, name, fields, prefix) => {
        let vault = type.conf.plugin.app.vault;
        let serial = 1;
        while (true) {
            let fullname = `${type.folder}/${prefix.exec({
                serial: serial.toString(),
            })} ${name}`.trim();

            if (!vault.getAbstractFileByPath(`${fullname}.md`)) {
                break;
            }

            serial += 1;
        }
        return serial.toString();
    }
);
// Prefix.registerProvider("date", (type, fields) => {
//     return "";
// });
