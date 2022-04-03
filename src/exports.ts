import TypingPlugin from "./main";
import { FieldSuggestModal, TypeSuggestModal } from "./modals/suggest";

const EXPORTS = { FieldSuggestModal, TypeSuggestModal };

export function registerExports(plugin: TypingPlugin) {
    plugin.exports = EXPORTS;
}
