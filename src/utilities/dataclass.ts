import "reflect-metadata";
import { log } from "src/utilities";

interface FieldOptions {
    inherit?: boolean | (<T>(a: T, b: T) => T);
    init?: boolean;
    required?: boolean;
}

enum Metadata {
    INHERIT = "__dataclass_inherit",
    INIT = "__dataclass_init",
    REQUIRED = "__dataclass_required",
    INHERITANCE_HANDLER = "__dataclass_inheritance_handler",
    LIST_FIELDS = "__dataclass_list_fields",
}

// to allow future reimplementation
function defineMetadata(metadataKey: any, metadataValue: any, target: Object, propertyKey?: string | symbol) {
    Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
}

function getMetadata(metadataKey: any, target: Object, propertyKey?: string | symbol) {
    return Reflect.getMetadata(metadataKey, target, propertyKey);
}

export function field(options: FieldOptions = {}) {
    return function (target: any, propertyKey: string | symbol) {
        const listFields = getMetadata(Metadata.LIST_FIELDS, target) ?? [];
        defineMetadata(Metadata.LIST_FIELDS, listFields.concat(propertyKey), target);
        defineMetadata(Metadata.INHERIT, options.inherit ?? true, target, propertyKey);
        defineMetadata(Metadata.INIT, options.init ?? true, target, propertyKey);
        defineMetadata(Metadata.REQUIRED, options.required ?? true, target, propertyKey);
        if (typeof options.inherit === "function") {
            defineMetadata(Metadata.INHERITANCE_HANDLER, options.inherit, target, propertyKey);
        }
    };
}

export class DataClass {
    static new<T extends DataClass>(this: new () => T, initialValues?: Partial<T>): T {
        const instance = new this();
        const fieldNames = getMetadata(Metadata.LIST_FIELDS, this.prototype) || [];
        if (initialValues && typeof initialValues === "object") {
            let key: keyof typeof initialValues;
            for (key in initialValues) {
                if (!fieldNames.includes(key)) {
                    continue;
                }
                const inConstructor = getMetadata(Metadata.INIT, instance, key);
                if (!inConstructor) {
                    continue;
                }
                instance[key] = initialValues[key];
            }
        }
        let key: keyof typeof instance;
        for (key of fieldNames) {
            // @ts-expect-error
            if (getMetadata(Metadata.REQUIRED, instance, key) && !(key in instance)) {
                // @ts-expect-error
                log.error(`Dataclass: Required parameter not initialized: ${key}`);
            }
        }
        instance.onAfterCreate();
        return instance;
    }

    onAfterCreate() {}
    onAfterInherit() {}

    protected inheritAttribute<T extends DataClass>(this: T, attr: keyof T, parent: T): void {
        const inheritable = getMetadata(Metadata.INHERIT, this, attr as string);
        if (!inheritable) {
            return;
        }

        const thisValue = this[attr];
        const parentValue = parent[attr];

        const inheritanceHandler = getMetadata(Metadata.INHERITANCE_HANDLER, this, attr as string);
        if (inheritanceHandler) {
            this[attr] = inheritanceHandler(thisValue, parentValue);
            return;
        }

        if (thisValue instanceof DataClass && parentValue instanceof DataClass) {
            thisValue.inherit(parentValue);
            return;
        }

        if (thisValue == undefined && parentValue != undefined) {
            this[attr] = parentValue;
        }
    }

    public inherit<T extends DataClass>(this: T, parent: T): void {
        for (let key in parent) {
            this.inheritAttribute(key as keyof T, parent);
        }
        this.onAfterInherit();
    }

    public copy<T extends DataClass>(this: T): T {
        const copyInstance = new (this.constructor as new () => T)();
        const fieldNames = getMetadata(Metadata.LIST_FIELDS, this.constructor.prototype) || [];

        for (const key of fieldNames) {
            copyInstance[key as keyof T] = this[key as keyof T];
        }

        copyInstance.onAfterCreate();
        return copyInstance;
    }

    public deepCopy<T extends DataClass>(this: T): T {
        const copyInstance = new (this.constructor as new () => T)();
        const fieldNames = getMetadata(Metadata.LIST_FIELDS, this.constructor.prototype) || [];

        for (const key of fieldNames) {
            const value = this[key as keyof T];
            if (value instanceof DataClass) {
                copyInstance[key as keyof T] = value.deepCopy();
            } else {
                copyInstance[key as keyof T] = value;
            }
        }

        copyInstance.onAfterCreate();
        return copyInstance;
    }
}
