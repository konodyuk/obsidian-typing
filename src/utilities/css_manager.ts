import createEmotion, { Emotion } from "@emotion/css/create-instance";
import { gctx } from "src/context";
import { getFont } from "./font_manager";

export class CSSManager {
    emotion: Emotion;
    enabledFonts: Set<string>;

    constructor(key: string) {
        this.emotion = createEmotion({
            key,
            container: document.head.createDiv(),
        });
        this.enabledFonts = new Set();
    }

    injectGlobal(css: string) {
        this.emotion.injectGlobal`${css}`;
    }

    clear() {
        this.emotion.flush();
        this.enabledFonts = new Set();
    }

    async enableFont(name: string) {
        let css = await getFont(name);
        if (!css) return;

        this.injectGlobal(css);
        this.enabledFonts.add(name);
    }

    async reloadFonts() {
        for (let font of this.enabledFonts) {
            if (!gctx.settings.enabledFonts.includes(font)) {
                // if at least one font is not present we need to remove all injected fonts
                this.clear();
                break;
            }
        }
        for (let font of gctx.settings.enabledFonts) {
            await this.enableFont(font);
        }
    }
}
