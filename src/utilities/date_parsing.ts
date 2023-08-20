import * as chrono from "chrono-node";

const custom = chrono.casual.clone();

custom.parsers.splice(
    0,
    0,
    {
        pattern: () => {
            return /^(?<month>[0-1]?[0-9])(\/((?<day>[0-1]?[0-9])(\/(?<year>[0-9]{2,4})?)?)?)?/;
        },
        extract: (context, match) => {
            let result = {
                month: +match.groups["month"],
                day: +(match.groups["day"] ?? context.refDate.getDay()),
                year: +(match.groups["year"] ?? context.refDate.getFullYear()),
            };
            return result;
        },
    },
    {
        pattern: () => {
            return /^(?<day>[0-3]?[0-9])(\.((?<month>[0-1]?[0-9])(\.(?<year>[0-9]{2,4})?)?)?)?/;
        },
        extract: (context, match) => {
            let result = {
                day: +match.groups["day"],
                month: +(match.groups["month"] ?? context.refDate.getMonth()),
                year: +(match.groups["year"] ?? context.refDate.getFullYear()),
            };
            return result;
        },
    },
    {
        pattern: () => {
            return /^(?<year>[0-9]{2,4})(\-((?<month>[0-1]?[0-9])(\-(?<day>[0-3]?[0-9])?)?)?)?/;
        },
        extract: (context, match) => {
            let result = {
                year: +match.groups["year"],
                month: +(match.groups["month"] ?? context.refDate.getMonth()),
                day: +(match.groups["day"] ?? context.refDate.getDay()),
            };
            return result;
        },
    }
);

custom.refiners.pop();

export function parseDate(value: string) {
    return custom.parseDate(value, new Date());
}
