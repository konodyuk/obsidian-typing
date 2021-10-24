export interface FieldSpec {
    name: string;
    kind: string;
    args?: Record<string, any>;
}

export interface TextSpec {
    source?: string;
    file?: string;
}

export interface MarginalSpec extends TextSpec {
    kind: "js" | "md";
}

export interface RenderingSpec {
    link?: TextSpec;
    card?: TextSpec;
}

export interface TypeSpec {
    name: string;
    folder: string;
    parents?: Array<string>;
    fields?: Array<FieldSpec>;
    header?: MarginalSpec;
    footer?: MarginalSpec;
    icon?: string;
    render?: RenderingSpec;
    prefix?: string;
    createable?: boolean;
}

export interface OverrideSpec {
    condition: string;
    header?: MarginalSpec;
    footer?: MarginalSpec;
    icon?: string;
}

export interface ActionSpec extends TextSpec {
    name: string;
    display?: {
        icon?: string;
        name?: string;
    };
}

// will be used to rename attachments
export interface HookSpec {
    event: "file-create" | "file-modify" | "file-delete";
    script: TextSpec;
}

export interface SettingsSpec {
    preamble?: TextSpec;
}

export interface ConfigSpec {
    types: Array<TypeSpec>;
    actions?: { [name: string]: ActionSpec };
    overrides?: Array<OverrideSpec>;
    hooks?: Array<HookSpec>;
    settings?: SettingsSpec;
}
