import { Script } from "src/script/script";

export class Action {
    constructor(
        public is_pinned: boolean,
        public name: string,
        public script: Script,
        public icon?: string
    ) {}
}
