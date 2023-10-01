import { Plugin, TFile, Vault } from "obsidian";
import { dirname, join, normalize } from "path-browserify";
import { DependencyGraph } from "src/utilities/dependency_graph";

export interface Module {
    env: Record<string, any>;
    file: FileSpec;
    error?: string;
}

export interface FileSpec {
    source: string;
    path: string;
    // hash: string;
}

interface StackFrame {
    module: Module;
}

export abstract class ModuleManagerSync<ContextType = any> {
    protected modules: Record<string, Module>;
    protected files: Record<string, FileSpec>;
    protected dependencyGraph: DependencyGraph;
    protected context: ContextType;
    protected callStack: StackFrame[] = [];

    public readonly extensions: string[] = [];

    constructor(private vault: Vault, private plugin: Plugin) {
        this.modules = {};
        this.files = {};
        this.dependencyGraph = new DependencyGraph();
    }

    public importSmart(path: string, base?: string) {
        base = base ?? this.currentFrame?.module?.file.path;
        if (base) {
            base = dirname(base);
        } else {
            base = "";
        }
        if (path.startsWith(".")) {
            let newPath = normalize(join(base, path));
            path = newPath;
        }
        if (!this.extensions.some((ext) => path.endsWith("." + ext))) {
            for (let ext of this.extensions) {
                let result = this.importModule(path + "." + ext);
                if (result != null && !result.error) return result;
            }
            for (let ext of this.extensions) {
                let result = this.importModule(path + "/index" + "." + ext);
                if (result != null && !result.error) return result;
            }
        }
        return this.importModule(path);
    }

    public importModule(path: string, source?: string, forceReload: boolean = false): Module | null {
        for (let frame of this.callStack) {
            if (frame.module.file.path == path) {
                return { error: `Recursive import: ${path}` };
            }
        }
        this.onBeforeImport(path);

        // TODO: was commented out
        if (!forceReload && path in this.modules && source == null) {
            return this.modules[path];
        }

        let file;
        if (source != null) {
            file = { source, path };
        } else {
            file = this.getFile(path);
        }

        if (!file) {
            return { error: `Unknown file: ${path}` };
        }

        const module: Module = { env: {}, file };

        const importerModule = this.activeModule;
        if (importerModule) {
            this.dependencyGraph.addDependency(importerModule.file.path, path);
        }
        this.enterFrame({ module });

        this.modules[path] = module;

        let success = false;

        try {
            success = this.evaluateModule(file, module);
        } catch (e) {
            this.exitFrame();
            return null;
        }

        if (!success) {
            this.exitFrame();
            if (module.error) return { error: module.error };
            return null;
        }

        if (source != null) {
            this.setFile(file);
        }

        this.exitFrame();
        this.onAfterImport(path);
        return module;
    }

    public async setup() {
        await this.setupFileWatcher();
    }

    private enterFrame(frame: StackFrame) {
        this.callStack.push(frame);
    }

    private exitFrame() {
        this.callStack.pop();
    }

    get currentFrame() {
        return this.callStack.length ? this.callStack[this.callStack.length - 1] : null;
    }

    get activeModule() {
        return this.currentFrame?.module;
    }

    private getFile(path: string): FileSpec {
        return this.files[path];
    }

    private setFile({ source, path }: FileSpec) {
        this.files[path] = { source, path };
    }

    protected async unloadModule(path: string) {
        delete this.files[path];
        delete this.modules[path];
        this.onModuleUpdate(path);
        this.reloadDependents(path);
        this.onAfterReload(path);
    }

    protected async reloadModule(path: string) {
        let file = await this.loadFile(path);
        this.setFile({ source: file, path });

        // TODO: was removed to not fail when new files are created
        if (path in this.modules) {
            this.onBeforeReload(path);
            this.importModule(path, null, true);
            this.onModuleUpdate(path);
        }

        this.reloadDependents(path);
        this.onAfterReload(path);
    }

    protected reloadDependents(path: string): void {
        const dependents = this.dependencyGraph.getDependents(path);
        if (dependents) {
            for (const dependent of dependents) {
                this.reloadModule(dependent);
            }
        }
    }

    protected abstract evaluateModule(file: FileSpec, env: Module): boolean;

    protected async loadFile(path: string): Promise<string> {
        let tfile = this.vault.getAbstractFileByPath(path);
        if (tfile == null) {
            return;
        }

        if (!(tfile instanceof TFile)) {
            return;
        }

        return await this.vault.read(tfile);
    }

    protected preloadFiles = async () => {
        for (let { path } of this.vault.getFiles()) {
            if (this.shouldRead(path)) {
                await this.reloadModule(path);
            }
        }
        this.onAfterPreload();
    };

    protected async setupFileWatcher() {
        this.plugin.app.workspace.onLayoutReady(this.preloadFiles);
        this.vault.on("modify", async ({ path }) => {
            if (this.shouldRead(path)) {
                this.reloadModule(path);
            }
        });
        this.vault.on("rename", async ({ path }, oldPath) => {
            if (this.shouldRead(oldPath)) {
                this.unloadModule(oldPath);
            }
            if (this.shouldRead(path)) {
                this.reloadModule(path);
            }
        });
        this.vault.on("create", async ({ path }) => {
            if (this.shouldRead(path)) {
                this.reloadModule(path);
            }
        });
        this.vault.on("delete", async ({ path }) => {
            if (this.shouldRead(path)) {
                this.unloadModule(path);
            }
        });
    }

    protected shouldRead(path: string): boolean {
        return this.extensions.some((ext) => path.endsWith("." + ext));
    }

    protected onAfterPreload(): void {}
    protected onModuleUpdate(path: string): void {}
    protected onBeforeImport(path: string): void {}
    protected onAfterImport(path: string): void {}
    protected onBeforeReload(path: string): void {}
    protected onAfterReload(path: string): void {}
}
