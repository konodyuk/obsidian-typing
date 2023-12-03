import { minimatch } from "minimatch";
import { Note, Type } from ".";

export class TypeGraph {
    public types: { [name: string]: Type } = {};
    private folderToType: { [folder: string]: Type } = {};
    private globToType: { [glob: string]: Type } = {};
    public isEmpty: boolean = true;
    public isReady: boolean = false;

    public isinstance(left: Note | Type | string, right: Type | string) {
        if (left instanceof Note) {
            left = left.type;
        }
        if (typeof left == "string") {
            left = this.get({ name: left });
        }
        if (typeof right == "string") {
            right = this.get({ name: right });
        }
        if (!left) return false;
        if (!right) return false;
        if (!left.parentNames) return false;
        if (left.parentNames.includes(right.name)) {
            return true;
        }
        for (let parent of left.parentNames) {
            if (this.isinstance(parent, right)) {
                return true;
            }
        }
        return false;
    }

    public get({ name, folder, path }: { name?: string; folder?: string; path?: string }) {
        if (name != null && name in this.types) {
            return this.types[name];
        }
        if (path != null) {
            folder = path.slice(0, path.lastIndexOf("/"));
            if (!folder || !folder.length) {
                return null;
            }
        }
        if (folder != null && folder in this.folderToType) {
            return this.folderToType[folder];
        }
        if (path != null) {
            for (let glob in this.globToType) {
                if (minimatch(path, glob)) {
                    return this.globToType[glob];
                }
            }
        }
        return null;
    }

    public add(type: Type) {
        this.types[type.name] = type;
        if (type.folder) this.folderToType[type.folder] = type;
        if (type.glob) this.globToType[type.glob] = type;
        this.isEmpty = false;
    }

    public clear() {
        this.types = {};
        this.folderToType = {};
        this.isEmpty = true;
    }
}
