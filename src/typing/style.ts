import { FnScript } from "src/scripting";
import { DataClass, field } from "src/utilities";
import { Values } from ".";

export enum ShowPrefixValues {
    ALWAYS = "always",
    SMART = "smart",
    NEVER = "never",
}

export enum HideInlineFieldsValues {
    ALL = "all",
    NONE = "none",
    DEFINED = "defined",
}

export class Style extends DataClass {
    @field()
    public link?: FnScript = null;
    @field()
    public header?: FnScript | Values.Markdown = null;
    @field()
    public footer?: FnScript | Values.Markdown = null;
    @field()
    public show_prefix: ShowPrefixValues = ShowPrefixValues.SMART;
    @field()
    public hide_inline_fields: HideInlineFieldsValues = HideInlineFieldsValues.NONE;
    @field()
    public css_classes: Array<string> = [];
    @field()
    public css: string = null;
}
