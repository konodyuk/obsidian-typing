import { Type } from "./type";

interface PrefixProvider {
    (type: Type, fields: { [name: string]: string }): string;
}

export class Prefix {
    static providers: { [name: string]: PrefixProvider };
    constructor(public format?: string) {}
    static fromString(s: string): Prefix {
        return new this();
    }
    splitByPrefix(name: string): { prefix: string; name: string } {
        return { prefix: "", name: name };
    }
    static registerProvider(name: string, callback: PrefixProvider) {
        this.providers[name] = callback;
    }
}

Prefix.registerProvider("date", (type, fields) => {
    return "";
});
Prefix.registerProvider("date_compact", (type, fields) => {
    return "";
});
Prefix.registerProvider("serial", (type, fields) => {
    return "";
});
