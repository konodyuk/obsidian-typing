import { Base64 } from "js-base64";
import { request, requestUrl } from "obsidian";
import { gctx } from "src/context";

function toBase64(data: ArrayBuffer): string {
    return Base64.fromUint8Array(new Uint8Array(data));
}

interface FontSpec {
    name: string;
    baseUrl: string;
    cssPath: string;
    fontFiles: { [relativePath: string]: string };
}

type FONTS = "fontawesome" | "lucide";
const FONT_SPECS: Record<FONTS, FontSpec> = {
    fontawesome: {
        name: "fontawesome",
        baseUrl: "https://unpkg.com/@fortawesome/fontawesome-free@6.4.2",
        cssPath: "/css/all.min.css",
        fontFiles: {
            "../webfonts/fa-regular-400.woff2": "/webfonts/fa-regular-400.woff2",
            "../webfonts/fa-solid-900.woff2": "/webfonts/fa-solid-900.woff2",
            "../webfonts/fa-brands-400.woff2": "/webfonts/fa-brands-400.woff2",
        },
    },
    lucide: {
        name: "lucide",
        baseUrl: "https://unpkg.com/lucide-static@0.276.0",
        cssPath: "/font/lucide.css",
        fontFiles: {
            "./lucide.woff2": "/font/lucide.woff2",
        },
    },
};

async function downloadFont(spec: FontSpec) {
    let css = await request(spec.baseUrl + spec.cssPath);
    const woffs: { [relativePath: string]: string } = {};

    for (const [relativePath, path] of Object.entries(spec.fontFiles)) {
        const response = await requestUrl(spec.baseUrl + path).arrayBuffer;
        woffs[relativePath] = `data:font/woff2;charset=utf-8;base64,${toBase64(response)}`;
    }

    for (const [relativePath, dataUrl] of Object.entries(woffs)) {
        const quoteStyles = ["", '"', "'"];
        quoteStyles.forEach((quote) => {
            css = css.replaceAll(`url(${quote}${relativePath}${quote})`, `url('${dataUrl}')`);
        });
    }

    return css;
}

function getFontCacheDir() {
    return `.obsidian/plugins/${gctx.plugin.manifest.id}/font-cache/`;
}

function getFontCachePath(name: FONTS) {
    return `${getFontCacheDir()}/${name}.css`;
}

export async function getFont(name: FONTS) {
    const cacheDir = getFontCacheDir();
    const cachePath = getFontCachePath(name);
    const adapter = gctx.app.vault.adapter;
    if (await adapter.exists(cachePath)) {
        return await adapter.read(cachePath);
    }

    const spec = FONT_SPECS[name];
    if (!spec) return null;

    const css = await downloadFont(spec);

    if (!(await adapter.exists(cacheDir))) {
        await adapter.mkdir(cacheDir);
    }

    await adapter.write(cachePath, css);
    return css;
}
