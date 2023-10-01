import { EventEmitter } from "events";
import * as fs from "fs";
import * as Path from "path";

Array.prototype.first = function () {
    return this.length > 0 ? this[0] : undefined;
};

Array.prototype.last = function () {
    return this.length > 0 ? this[this.length - 1] : undefined;
};

Array.prototype.contains = function (target) {
    return this.includes(target);
};

export class Scope {
    register() {}
}

export class Component {
    registerEvent() {}
}

export class Events extends EventEmitter {
    trigger(name: string, ...data: any[]): void {
        this.emit(name, ...data);
    }
}
export class Workspace {
    private layoutReadyListeners: Array<(...args: any[]) => Promise<void>> = [];

    onLayoutReady(cb: (...args: any[]) => Promise<void>) {
        this.layoutReadyListeners.push(cb);
    }

    async triggerLayoutReady(...data: any[]): Promise<void> {
        const promises = this.layoutReadyListeners.map((listener) => listener(...data));
        await Promise.all(promises);
    }
}

export class MetadataCache extends Events {
    getFileCache(tfile: TFile) {
        return null;
    }
}

export class FileManager {
    constructor(public vault: Vault) {}
    renameFile(tfile: TFile, path: string) {
        this.vault.rename(tfile, path);
    }
}

export class App {
    vault: Vault;
    workspace: Workspace;
    metadataCache: MetadataCache;
    constructor(vault: Vault) {
        this.vault = vault;
        this.workspace = new Workspace();
        this.metadataCache = new MetadataCache();
        this.fileManager = new FileManager(vault);
    }
}

export class MarkdownView {}
export class Platform {}
export class Modal {}
export class FuzzySuggestModal {}
export class SuggestModal {}
export class Setting {}
export class PluginSettingTab {}
export class MarkdownRenderChild {}
export class Plugin {
    constructor(public app: App) {}
    loadData() {
        return {};
    }
    registerEvent() {}
}
export abstract class TextFileView {}

export abstract class TAbstractFile {
    vault: Vault;
    path: string;
    name: string;
    parent: TFolder;
}

export class TFile extends TAbstractFile {
    stat: any;
    basename: string;
    extension: string;
    content: string | ArrayBuffer;

    constructor(public vault: Vault, public path: string, public parent: TFolder, content: string | ArrayBuffer) {
        super();
        this.name = Path.basename(this.path);
        this.basename = Path.basename(this.path, Path.extname(this.path));
        this.extension = Path.extname(this.path);
        this.content = content;
        this.stat = { size: content.byteLength || content.length };
    }
}

export class TFolder extends TAbstractFile {
    isRoot(): boolean {
        return this.path === "/";
    }

    constructor(
        public vault: Vault,
        public path: string,
        public parent: TFolder,
        public children: TAbstractFile[] = []
    ) {
        super();
        this.name = Path.basename(this.path);
    }
}

export class Vault extends Events {
    files: Map<string, TAbstractFile>;
    root: TFolder;
    name: string = "mock-vault";
    vaultPath: string;

    constructor(vaultPath?: string) {
        super();
        this.files = new Map();
        if (vaultPath) {
            this.vaultPath = Path.join(__dirname, vaultPath);
            this.loadFilesFromFS("", null);
        }
        this.root = this.getAbstractFileByPath("") as TFolder;
    }

    private loadFilesFromFS(folderPath: string, parent: TFolder | null) {
        const directoryEntries = fs.readdirSync(Path.join(this.vaultPath, folderPath));
        for (const entryName of directoryEntries) {
            const entryPath = Path.join(folderPath, entryName);
            const stats = fs.statSync(Path.join(this.vaultPath, entryPath));
            if (stats.isDirectory()) {
                const folder = new TFolder(this, entryPath, parent || null, []);
                this.files.set(entryPath, folder);
                this.loadFilesFromFS(entryPath, folder);
            } else {
                const file = new TFile(
                    this,
                    entryPath,
                    parent || null,
                    fs.readFileSync(Path.join(this.vaultPath, entryPath))
                );
                this.files.set(entryPath, file);
            }
        }
    }

    getName(): string {
        return this.name;
    }

    getAbstractFileByPath(path: string): TAbstractFile | null {
        return this.files.get(path) || null;
    }

    getRoot(): TFolder {
        return this.root;
    }

    async create(path: string, data: string): Promise<TFile> {
        const file = new TFile(this, path, this.getAbstractFileByPath(Path.dirname(path)) as TFolder, data);
        this.files.set(path, file);
        return file;
    }

    async createBinary(path: string, data: ArrayBuffer): Promise<TFile> {
        const file = new TFile(this, path, this.getAbstractFileByPath(Path.dirname(path)) as TFolder, data);
        this.files.set(path, file);
        return file;
    }

    async createFolder(path: string): Promise<void> {
        const folder = new TFolder(this, path, this.getAbstractFileByPath(Path.dirname(path)) as TFolder);
        this.files.set(path, folder);
    }

    async read(file: TFile): Promise<string> {
        return (file as TFile).content.toString();
    }

    async cachedRead(file: TFile): Promise<string> {
        return this.read(file);
    }

    async readBinary(file: TFile): Promise<ArrayBuffer> {
        return (file as TFile).content as ArrayBuffer;
    }

    getResourcePath(file: TFile): string {
        return file.path;
    }

    async delete(file: TAbstractFile): Promise<void> {
        this.files.delete(file.path);
    }

    async rename(file: TAbstractFile, newPath: string): Promise<void> {
        this.files.delete(file.path);
        file.path = newPath;
        file.name = Path.basename(newPath);
        this.files.set(newPath, file);
    }

    async modify(file: TFile, data: string): Promise<void> {
        (file as TFile).content = data;
    }

    async modifyBinary(file: TFile, data: ArrayBuffer): Promise<void> {
        (file as TFile).content = data;
    }

    async append(file: TFile, data: string): Promise<void> {
        (file as TFile).content += data;
    }

    async copy(file: TFile, newPath: string): Promise<TFile> {
        const newFile = await this.create(newPath, "");
        newFile.content = (file as TFile).content;
        return newFile;
    }

    getAllLoadedFiles(): TAbstractFile[] {
        return Array.from(this.files.values());
    }

    static recurseChildren(root: TFolder, cb: (file: TAbstractFile) => any): void {
        cb(root);
        if (root instanceof TFolder) {
            for (const child of root.children) {
                this.recurseChildren(child as TFolder, cb);
            }
        }
    }

    getMarkdownFiles(): TFile[] {
        return Array.from(this.files.values()).filter(
            (file) => file instanceof TFile && file.extension === ".md"
        ) as TFile[];
    }

    getFiles(): TFile[] {
        return Array.from(this.files.values()).filter((file) => file instanceof TFile) as TFile[];
    }
}
