import { CompilationError } from "src/language/grammar";
import { Action } from "./action";
import { Type } from "./type";
import { Settings } from "./value";

export class Registry {
    public types: { [name: string]: Type } = {};
    public folderIndex: { [folder: string]: Type } = {};
    public settings: Settings;
    public actions: Record<string, Action>;

    addType(newType: Type) {
        if (newType.name in this.types) {
            throw new CompilationError({
                msg: `Duplicate type name: ${newType.name}`,
                node: newType.args.name,
            });
        }

        for (let actionName in this.actions) {
            if (!(actionName in newType.actions)) {
                newType.actions[actionName] = this.actions[actionName];
            }
        }

        if (newType.settings == null) {
            newType.settings = this.settings;
        }

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
