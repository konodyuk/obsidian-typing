import { Type } from "./type";

export class Registry {
    public types: { [name: string]: Type } = {};
    public folderIndex: { [folder: string]: Type } = {};

    addType(newType: Type) {
        this.types[newType.name] = newType;
        this.folderIndex[newType.folder] = newType;
    }

    byName(name: string): Type {
        return this.types[name];
    }

    byFolder(folder: string): Type | null {
        let type = this.folderIndex[folder];
        if (!type) {
            return null;
        }
        return type;
    }

    byPath(path: string): Type | null {
        let lastIndexOfPathSep = path.lastIndexOf("/");
        if (lastIndexOfPathSep == -1) {
            return null;
        }
        let folder = path.substring(0, lastIndexOfPathSep);

        let type = this.byFolder(folder);
        return type;
    }
}
