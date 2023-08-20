export class DependencyGraph {
    private dependents: { [key: string]: Set<string> };
    private dependencies: { [key: string]: Set<string> };

    constructor() {
        this.dependents = {};
        this.dependencies = {};
    }

    addDependency(dependent: string, dependency: string): void {
        if (!(dependency in this.dependents)) {
            this.dependents[dependency] = new Set();
        }

        if (!(dependent in this.dependencies)) {
            this.dependencies[dependent] = new Set();
        }

        this.dependents[dependency].add(dependent);
        this.dependencies[dependent].add(dependency);
    }

    getDependents(dependency: string): Set<string> | undefined {
        return this.dependents[dependency];
    }

    getDependencies(dependent: string): Set<string> | undefined {
        return this.dependencies[dependent];
    }
}
