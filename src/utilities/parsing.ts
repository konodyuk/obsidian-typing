export function parseLink(value: string) {
    value = value ?? "";
    if (value.startsWith("[[")) value = value.slice(2);
    if (value.endsWith("]]")) value = value.slice(0, value.length - 2);

    let path = "",
        subpath = "",
        display = "";

    // Split by # first
    [path, value] = value.split("#", 2);
    value = value ?? "";

    // If there's no #, then we should handle the | directly
    if (!value && path.includes("|")) {
        [path, display] = path.split("|", 2);
        display = display ?? "";
    } else {
        [subpath, display] = value.split("|", 2);
        display = display ?? "";
    }

    return { path, subpath, display };
}

export function parseLinkExtended(value: string) {
    let { path, subpath, display } = parseLink(value);

    let folder = "",
        name = "",
        extension = "";

    if (path.includes("/")) {
        let segments = path.split("/");
        folder = segments.slice(0, segments.length - 1).join("/");
        name = segments[segments.length - 1];
    } else {
        folder = "";
        name = path;
    }

    ({ name, extension } = parseFileExtension(name));

    let result = { folder, name, extension, subpath, display };
    return result;
}

export function parseFileExtension(name: string) {
    let extension = "";
    if (name.includes(".")) {
        let segments = name.split(".");
        name = segments.slice(0, segments.length - 1).join(".");
        extension = segments[segments.length - 1];
    }
    return { name, extension };
}
