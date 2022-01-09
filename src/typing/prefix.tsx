import { Type } from "./type";

export class Prefix {
    public regex: RegExp;
    constructor(public template: string) {
        let regex = "^" + template;
        for (let providerName in PREFIX_PROVIDERS) {
            regex = regex.replace(
                `{${providerName}}`,
                PREFIX_PROVIDERS[providerName].regex
            );
        }
        this.regex = RegExp(regex);
    }
    split(name: string): { prefix: string; name: string } {
        let match = this.regex.exec(name);
        if (!match) {
            return { prefix: "", name: name };
        }
        let prefix = name.slice(0, match[0].length).trim();
        let significantName = name.slice(match[0].length).trim();
        return { prefix: prefix, name: significantName };
    }
    format(args: { [key: string]: string }) {
        let result = this.template;
        for (let key in args) {
            result = result.replace(`{${key}}`, args[key]);
        }
        return result;
    }
    new(type: Type): string {
        let result = this.template;
        for (let providerName in PREFIX_PROVIDERS) {
            result = result.replace(
                `{${providerName}}`,
                PREFIX_PROVIDERS[providerName].callback(this, type)
            );
        }
        return result;
    }
}

interface PrefixProvider {
    callback: { (prefix: Prefix, type: Type): string };
    regex?: string;
}

export let PREFIX_PROVIDERS: { [name: string]: PrefixProvider } = {
    date_compact: {
        regex: "[0-9A-Za-z]+[0-9A-C]{1}[0-9A-V]{1}[0-9A-N]{1}[0-9A-Za-x]{2}\\s*",
        callback: (prefix, type) => {
            const B62_RANGE =
                "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

            let result = "";
            let date = new Date();
            let year = date.getFullYear() - 2000;
            while (true) {
                result = B62_RANGE[year % 62] + result;
                year = ~~(year / 62);
                if (year == 0) {
                    break;
                }
            }

            result += B62_RANGE[date.getMonth() + 1];
            result += B62_RANGE[date.getDate()];
            result += B62_RANGE[date.getHours()];
            result += B62_RANGE[date.getMinutes()];
            result += B62_RANGE[date.getSeconds()];
            return result;
        },
    },
};
