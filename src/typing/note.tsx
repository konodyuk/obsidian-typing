import { TFile } from "obsidian";
import { LiteralValue } from "obsidian-dataview";
import { useRef } from "react";
import { gctx } from "src/context";
import { autoFieldAccessor, IFieldAccessor } from "src/middleware/field_accessor";
import { MarginalComponent } from "src/middleware/marginal_rendering";
import { Script } from "src/scripting";
import { Markdown, prompt, Prompt } from "src/ui";
import { bindCollection, DataClass, field, RenderLink } from "src/utilities";
import { HookContextType, HookNames, RelationsProxy, Style, Type } from ".";

export interface NoteState {
    type: Type;
    prefix?: string;
    title?: string;
    fields?: Record<string, string>;
    text?: string;
}

export class Note {
    public path: string;
    public type: Type | null;
    private _methods: Record<string, Function>;
    private _actions: Record<string, Function>;
    private _relations: RelationsProxy;

    private get _fields() {
        if (!this.type) return null;

        let cached = gctx.noteCache.get(this.path, "fields");
        if (cached) return cached;

        let newProxy = FieldsProxy.new({ note: this });
        gctx.noteCache.set(this.path, "fields", newProxy);
        return newProxy;
    }

    get fields() {
        return this._fields?.proxy;
    }

    get actions() {
        if (!this.type) return null;
        if (!this._actions) this._actions = bindCollection(this.type.actions, { note: this, type: this.type });
        return this._actions;
    }

    get methods() {
        if (!this.type) return null;
        if (!this._methods) this._methods = bindCollection(this.type.methods, { note: this, type: this.type });
        return this._methods;
    }

    get relations() {
        if (!this.type) return null;
        if (!this._relations) this._relations = RelationsProxy.new({ note: this });
        return this._relations;
    }

    get page(): Record<string, LiteralValue> {
        let cached = gctx.noteCache.get(this.path, "page");
        if (cached) return cached;

        let newPage = gctx.dv.page(this.path);
        gctx.noteCache.set(this.path, "page", newPage);
        return newPage;
    }

    private constructor(path: string, type: Type | null) {
        this.path = path;
        this.type = type;
    }

    static new(path: string, opts?: { type?: Type; isSuperCall?: boolean }) {
        opts = opts ?? {};

        if (opts.isSuperCall) {
            let cached = gctx.noteCache.get(path, "superInstances")?.[opts.type?.name];
            if (cached) return cached;
        } else {
            let cached = gctx.noteCache.get(path, "note");
            if (cached) return cached;
        }

        let type = opts.type ?? gctx.graph.get({ path });

        if (type == null) {
            // support for type specification via frontmatter field `_type`
            // TODO: do this only if it is configured
            let file = Note.file(path);
            if (file) {
                let explicitTypeName = gctx.app.metadataCache.getFileCache(file)?.frontmatter?._type;
                if (explicitTypeName) {
                    type = gctx.graph.get({ name: explicitTypeName });
                }
            }
        }

        if (type == null) type = gctx.graph.get({ name: "default" });

        let note = new Note(path, type);

        if (!opts.isSuperCall && !opts.type) {
            gctx.noteCache.set(path, "note", note);
        } else {
            let superInstances = gctx.noteCache.get(path, "superInstances") ?? {};
            superInstances[opts?.type?.name] = note;
            gctx.noteCache.set(path, "superInstances", superInstances);
        }

        return note;
    }

    // more explicit alias for note.page
    get dvpage() {
        return this.page;
    }

    get folder(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");
        if (lastIndexOfPathSep != -1) {
            return this.path.slice(0, lastIndexOfPathSep);
        } else {
            return "";
        }
    }

    get filename(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");

        return this.path.slice(lastIndexOfPathSep + 1, this.path.length);
    }

    get fullname(): string {
        let filename = this.filename;

        return filename.slice(0, filename.lastIndexOf("."));
    }

    get prefix(): string {
        if (this.type?.prefix) {
            return this.type.prefix.parse(this.fullname).prefix;
        } else {
            return "";
        }
    }

    get extension(): string {
        let filename = this.filename;

        return filename.slice(filename.lastIndexOf(".") + 1);
    }

    get title(): string {
        if (this.type?.prefix) {
            return this.type.prefix.parse(this.fullname).name;
        } else {
            return this.fullname;
        }
    }

    set title(title: string) {
        this.rename({ title });
    }

    get state(): Promise<NoteState> {
        return this.getState();
    }

    set state(state: NoteState | Promise<NoteState>) {
        (async () => this.applyState(await state))();
    }

    async getState(): Promise<NoteState> {
        let fields: Record<string, string> = {};
        if (this.typed) {
            for (let fieldName in this.type.fields) {
                fields[fieldName] = await this.fields[fieldName];
            }
        }
        return { title: this.title, fields, type: this.type, prefix: this.prefix };
    }

    // TODO: rename to setState?
    async applyState(newState?: NoteState) {
        if (newState == null) {
            return;
        }

        let state = await this.state;
        let somethingChanged = false;
        for (let fieldName in newState.fields) {
            if (state.fields[fieldName] != newState.fields[fieldName]) {
                somethingChanged = true;
                await this._fields.setValue(fieldName, newState.fields[fieldName]);
            }
        }
        if (somethingChanged) {
            gctx.noteCache.invalidate(this.path);
            this.runHook(HookNames.ON_METADATA_CHANGE, { note: this, newState, prevState: state });
        }

        if (state.title != newState.title) {
            await this.rename({ title: newState.title });
        }
    }

    async promptState() {
        let state = await this.getState();
        let newState = await prompt(
            <Prompt submitText="Save" returnOnExit={true} noteState={state}>
                <Prompt.Title />
                <Prompt.Fields />
            </Prompt>,
            { confirmation: false }
        );
        if (!newState) return;
        await this.applyState(newState);
    }

    async runAction(name: string) {
        this.type.actions[name].script.call({ note: this });
    }

    async runHook<T extends HookNames>(name: T, context: HookContextType<T>) {
        this.type?.hooks.run(name, context);
    }

    async rename({
        title,
        filename,
        extension,
        prefix,
        folder,
        path,
    }: {
        title?: string;
        filename?: string;
        extension?: string;
        prefix?: string;
        folder?: string;
        path?: string;
    }) {
        if (path == null) {
            if (filename == null) {
                title = title ?? this.title;
                prefix = prefix ?? this.prefix;
                extension = extension ?? this.extension;
                let noteName = `${prefix} ${title}`.trim();
                filename = `${noteName}.${extension}`;
            }
            folder = folder ?? this.folder;
            path = `${folder}/${filename}`;
        }
        let prevPath = this.file.path;
        let prevFilename = this.filename;
        let prevFullname = this.fullname;
        let prevTitle = this.title;

        await gctx.app.fileManager.renameFile(this.file, path);
        this.path = path;

        // TODO: probably support renaming of cache entry to not leave existing Note instances
        // for current path outdated
        gctx.noteCache.invalidate(path);
        gctx.noteCache.invalidate(prevPath);

        // TODO: rewrite as a global callback
        this.runHook(HookNames.ON_RENAME, { note: this, prevPath, prevFilename, prevFullname, prevTitle });
    }

    super(typeName?: string) {
        if (!this.type) return this;
        if (!typeName) {
            if (this.type.parentNames.length == 1) {
                typeName = this.type.parentNames[0];
            } else {
                throw new Error(
                    `Type ${this.type.name} has ${this.type.parentNames.length}!=1 parents. Please specify parent type name explictly`
                );
            }
        }
        let superType = this.type.getAncestor(typeName);
        if (!superType) {
            throw new Error(
                `Invalid super type: ${typeName} does not exist or is not an ancestor of ${this.type.name}`
            );
        }
        return Note.new(this.path, { type: superType, isSuperCall: true });
    }

    get typed() {
        return this.type != null;
    }

    private static file(path: string): TFile {
        let tfile = gctx.app.vault.getAbstractFileByPath(path);
        if (!tfile) {
            return null;
        }
        if (!(tfile instanceof TFile)) {
            // TODO: this is probably not right, but I think this should be noexcept
            return null;
        }
        return tfile;
    }

    get file(): TFile {
        return Note.file(this.path);
    }

    link(opt?: { short: boolean }) {
        if (opt?.short) {
            return `[[${this.fullname}]]`;
        } else {
            return `[[${this.path}|${this.title}]]`;
        }
    }

    Link = ({ children, linkText, ...props }: { children?: any; linkText?: string }) => {
        let ref = useRef();
        return (
            <a
                class="internal-link no-postprocessing"
                href={this.path}
                ref={(el) => {
                    ref.current = el;
                }}
            >
                {children ?? (
                    <RenderLink note={this} type={this.type} container={ref.current} linkText={linkText} {...props} />
                )}
            </a>
        );
    };

    Header = () => {
        return <this.Marginal marginal={this.type?.style?.header} />;
    };
    Footer = () => {
        return <this.Marginal marginal={this.type?.style?.footer} />;
    };
    private Marginal = ({ marginal }: { marginal: Style["header"] }) => {
        if (!marginal) return null;
        if (marginal instanceof Script) {
            return <MarginalComponent script={marginal} />;
        } else {
            return <Markdown text={marginal.source} />;
        }
    };

    async open() {
        let tfile = this.file;
        if (tfile) {
            await gctx.app.workspace.getLeaf().openFile(tfile);
        }
    }
}

class FieldsProxy extends DataClass {
    @field()
    note: Note;

    accessor: IFieldAccessor;
    proxy: Record<string, Promise<string> | string> = {};

    onAfterCreate() {
        this.refreshAccessor();
    }

    refreshAccessor(): void {
        this.accessor = autoFieldAccessor(this.note.path, gctx.plugin);
        let proxy = this;

        for (let fieldName in this.note.type.fields) {
            Reflect.defineProperty(this.proxy, fieldName, {
                get: async function () {
                    return proxy.getValue(fieldName);
                },
                set: async function (value: string | Promise<string>) {
                    return proxy.setValue(fieldName, value);
                },
            });
        }
    }

    async getValue(fieldName: string) {
        try {
            return await this.accessor.getValue(fieldName);
        } catch (e) {
            return undefined;
        }
    }

    async setValue(fieldName: string, value: string | Promise<string>) {
        return this.accessor.setValue(fieldName, await value);
    }
}

export interface NoteCacheEntry {
    note?: Note;
    superInstances?: { [typeName: string]: Note };
    fields?: FieldsProxy;
    page?: Record<string, any>;
}

export class NoteCache {
    entries: Record<string, NoteCacheEntry> = {};

    invalidate(path: string) {
        this.entries[path] = undefined;
    }
    invalidateAll() {
        this.entries = {};
    }
    get<K extends keyof NoteCacheEntry>(path: string, key: K) {
        return this.entries[path]?.[key];
    }
    set<K extends keyof NoteCacheEntry>(path: string, key: K, value: NoteCacheEntry[K]) {
        if (!this.entries[path]) this.entries[path] = {};
        this.entries[path][key] = value;
    }

    startWatch() {
        gctx.plugin.registerEvent(
            gctx.app.metadataCache.on("dataview:metadata-change", (op, file) => {
                if (gctx.graph.isReady) this.invalidate(file.path);
            })
        );
    }
}
