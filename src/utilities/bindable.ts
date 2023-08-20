export interface Bindable<BindingContext, Result> {
    bind(context: BindingContext): Result;
}

export class BindableCollection<
    Item extends Bindable<BindingContext, Result>,
    BindingContext = Item extends Bindable<infer BC, any> ? BC : never,
    Result = Item extends Bindable<any, infer R> ? R : never
> {
    constructor(public collection: Record<string, Item>) {}

    bind(context: BindingContext): Record<string, Result> {
        const boundCollection: Partial<Record<string, Result>> = {};

        for (const key in this.collection) {
            Object.defineProperty(boundCollection, key, {
                get: () => this.collection[key].bind(context),
            });
        }

        return boundCollection as Record<string, Result>;
    }
}

export function bindCollection<
    Item extends Bindable<BindingContext, Result>,
    BindingContext = Item extends Bindable<infer BC, any> ? BC : never,
    Result = Item extends Bindable<any, infer R> ? R : never,
    Key extends string = string
>(collection: Record<Key, Item>, context: BindingContext): Record<Key, Result> {
    const boundCollection: Partial<Record<Key, Result>> = {};

    for (const key in collection) {
        Object.defineProperty(boundCollection, key, {
            get: () => collection[key].bind(context),
        });
    }

    return boundCollection as Record<Key, Result>;
}
