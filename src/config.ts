import {
    ActionSpec,
    ConfigSpec,
    HookSpec,
    SettingsSpec,
    RenderingSpec,
    TextSpec,
    MarginalSpec,
} from "./config_specs";
import TypingPlugin from "./main";
import { Type, Override, registry } from "./type";
import { gracefullyAlert } from "./utils";

export class Settings {
    preamble: Text;
    static async fromSpec(spec: SettingsSpec, conf: Config): Promise<Settings> {
        let result = new this();
        result.preamble = await Text.fromSpec(spec.preamble, conf);
        return result;
    }
}
export class Hook {
    event: "file-create" | "file-modify" | "file-delete";
    script: Text;
    static async fromSpec(spec: HookSpec, conf: Config): Promise<Hook> {
        let result = new this();
        result.event = spec.event;
        result.script = await Text.fromSpec(spec.script, conf);
        return result;
    }
}

export class Text {
    constructor(public conf: Config, public source: string) {}
    static async fromSpec(spec: TextSpec, conf: Config): Promise<Text> {
        let source = null;
        if (spec.source && spec.file) {
            gracefullyAlert(
                `both source and file are specified in TextSpec: ${spec.file}`
            );
            spec.file = null;
        }
        if (spec.file) {
            source = await conf.plugin.app.vault.adapter.read(spec.file);
        }
        if (spec.source) {
            source = spec.source;
        }
        if (!source) {
            gracefullyAlert(`either source or file should be specified`);
        }
        return new this(conf, source);
    }
}

export class Marginal extends Text {
    constructor(conf: Config, source: string, public kind: "js" | "md" = "js") {
        super(conf, source);
    }
    static async fromSpec(spec: MarginalSpec, conf: Config): Promise<Marginal> {
        let result = (await super.fromSpec(spec, conf)) as Marginal;
        if (spec.kind) {
            result.kind = spec.kind;
        }
        if (result.kind == "js" && conf.settings?.preamble) {
            result.source = conf.settings.preamble.source + ";" + result.source;
        }
        return result;
    }
}

export class Action extends Text {
    constructor(
        conf: Config,
        source: string,
        public name: string,
        public display: {
            icon?: string;
            name?: string;
        } = {}
    ) {
        super(conf, source);
    }
    static async fromSpec(spec: ActionSpec, conf: Config): Promise<Action> {
        let result = (await super.fromSpec(spec, conf)) as Action;
        result.name = spec.name;
        if (spec.display != null) {
            result.display = spec.display;
        }
        if (conf.settings?.preamble) {
            result.source = conf.settings.preamble.source + ";" + result.source;
        }
        return result;
    }
}

export class Rendering {
    constructor(public conf: Config, public link?: Text, public card?: Text) {}
    static async fromSpec(
        spec: RenderingSpec,
        conf: Config
    ): Promise<Rendering> {
        let link = null;
        let card = null;
        if (spec.link != null) {
            link = await Text.fromSpec(spec.link, conf);
        }
        if (spec.card != null) {
            card = await Text.fromSpec(spec.card, conf);
        }
        if (link && conf.settings?.preamble) {
            link.source = conf.settings.preamble.source + ";" + link.source;
        }
        if (card && conf.settings?.preamble) {
            card.source = conf.settings.preamble.source + ";" + card.source;
        }
        return new this(conf, link, card);
    }
}

export class Config {
    constructor(
        public plugin: TypingPlugin,
        public types: { [name: string]: Type } = {},
        public actions: { [name: string]: Action } = {},
        public overrides: Array<Override> = [],
        public hooks: Array<Hook> = [],
        public settings: Settings = null
    ) {}
    static async fromSpec(
        spec: ConfigSpec,
        plugin: TypingPlugin
    ): Promise<Config> {
        registry.clear();
        let result = new this(plugin);
        result.settings = await Settings.fromSpec(spec.settings, result);
        for (let typeSpec of spec.types) {
            let newType = await Type.fromSpec(typeSpec, result);
            registry.addType(newType);
            result.types[newType.name] = newType;
        }
        if (spec.actions) {
            for (let specId in spec.actions) {
                let actionSpec = spec.actions[specId];
                let newAction = await Action.fromSpec(actionSpec, result);
                result.actions[specId] = newAction;
            }
        }
        if (spec.overrides) {
            for (let overrideSpec of spec.overrides) {
                let newOverride = await Override.fromSpec(overrideSpec, result);
                registry.addOverride(newOverride);
                result.overrides.push(newOverride);
            }
        }
        if (spec.hooks) {
            for (let hookSpec of spec.hooks) {
                let newHook = await Hook.fromSpec(hookSpec, result);
                result.hooks.push(newHook);
            }
        }
        return result;
    }
}
