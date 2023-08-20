enum LogLevel {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    CRITICAL = 5,
    HIGHEST = 6,
}

const COLOR_MAP = {
    [LogLevel.DEBUG]: "green",
    [LogLevel.INFO]: "#9999ff",
    [LogLevel.WARN]: "yellow",
    [LogLevel.ERROR]: "red",
    [LogLevel.CRITICAL]: "black",
};

const MIN_LEVEL = LogLevel.ERROR;
const PREFIX: string[] = ["[Obsidian Typing]"];
const FLAT = false;

let INDENT = 0;
let INDENT_UNIT = ">   ";

function getIndent() {
    return INDENT_UNIT.repeat(INDENT);
}

class Logger {
    private output(level: LogLevel, message: string, kwargs?: any) {
        if (!shouldLog(level)) return;

        let logLine = getLogLine(level, message);
        if (kwargs) {
            console.log(...logLine, ...kwargs);
            // console.groupCollapsed(...logLine);
            // console.table(kwargs);
            // console.groupEnd();
        } else {
            console.log(...logLine);
        }
    }

    debug(message: string, ...kwargs: any) {
        this.output(LogLevel.DEBUG, message, kwargs);
    }

    info(message: string, ...kwargs: any) {
        this.output(LogLevel.INFO, message, kwargs);
    }

    warn(message: string, ...kwargs: any) {
        this.output(LogLevel.WARN, message, kwargs);
    }

    error(message: string, ...kwargs: any) {
        this.output(LogLevel.ERROR, message, kwargs);
    }

    critical(message: string, ...kwargs: any) {
        this.output(LogLevel.CRITICAL, message, kwargs);
    }

    func(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!shouldLog(LogLevel.DEBUG)) {
            return descriptor;
        }

        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            if (FLAT) {
                console.log(
                    ...getLogLine(
                        LogLevel.DEBUG,
                        `Calling ${propertyKey}(${args.map((x) => safeStringify(x, 2)).join(", ")})`
                    )
                );
                INDENT++;
            } else {
                console.groupCollapsed(
                    ...getLogLine(
                        LogLevel.DEBUG,
                        `Calling ${propertyKey}(${args.map((x) => safeStringify(x, 2)).join(", ")})`
                    )
                );
            }
            console.groupCollapsed(getIndent(), "Parameters:");
            console.table(args);
            console.groupEnd();

            try {
                const result = originalMethod.apply(this, args);
                console.log(getIndent(), "Returned:", result);
                if (FLAT) INDENT--;
                else console.groupEnd();
                return result;
            } catch (error) {
                console.error("Error occurred:", error);
                if (FLAT) INDENT--;
                else console.groupEnd();
                throw error;
            }
        };
        return descriptor;
    }

    indent() {
        INDENT++;
    }

    dedent() {
        INDENT--;
    }
}

function shouldLog(level: LogLevel) {
    return MIN_LEVEL <= level;
}

function getLogLine(level: LogLevel, message: string) {
    return [
        `${getIndent()}%c[${level}]%c ${PREFIX.join(" ")} ${message}`,
        // @ts-expect-error
        `color: ${COLOR_MAP[level]}`,
        "color: inherit",
    ];
}

function safeStringify(obj: any, depth: number = 1): string {
    let cache: any[] = [];
    const stringify = JSON.stringify(
        obj,
        (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (cache.length >= depth) {
                    // If we're at max depth, replace object with a string
                    return "[Object]";
                } else if (cache.contains(value)) {
                    // Handle circular references
                    return "[Circular]";
                }
                cache.push(value);
            }
            return value;
        },
        2
    );
    cache = null; // Enable garbage collection
    return stringify;
}

export const log = new Logger();
