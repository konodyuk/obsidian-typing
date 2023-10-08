import { Note, Type } from ".";

export class TypeGraph {
    public types: { [name: string]: Type } = {};
    private folderToType: { [folder: string]: Type } = {};
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
        if (!left.parents) return false;
        if (left.parents.includes(right.name)) {
            return true;
        }
        for (let parent of left.parents) {
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
        return null;
    }

    public add(type: Type) {
        this.types[type.name] = type;
        this.folderToType[type.folder] = type;
        this.isEmpty = false;
    }

    public clear() {
        this.types = {};
        this.folderToType = {};
        this.isEmpty = true;
        this.isReady = false;
    }
}
