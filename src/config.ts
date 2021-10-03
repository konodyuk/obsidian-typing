export interface FieldSpec {
    name: string;
    kind: "any" | "link" | "list" | "choice";
    prompted: boolean;
    types?: "any" | Array<string>;
    options?: Array<string>;
}

export interface TextSpec {
    value?: string;
    file?: string;
}

export interface MarginalSpec extends TextSpec {
    kind: "js" | "md";
}

export interface IconSpec extends TextSpec {
    kind: "fa" | "svg" | "text";
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
    icon?: IconSpec;
    render?: RenderingSpec;
}

export interface OverrideSpec {
    condition: string;
    header?: MarginalSpec;
    footer?: MarginalSpec;
    icon?: IconSpec;
}

export interface RuleSpec {}

export interface Config {
    types: Array<TypeSpec>;
    overrides: Array<OverrideSpec>;
    rules: Array<RuleSpec>;
    preamble?: string;
}
