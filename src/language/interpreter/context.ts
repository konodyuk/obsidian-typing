import { NodeType } from "../visitors";

export enum LintMessageSeverity {
    error = "error",
    warning = "warning",
    info = "info",
}

export interface LintMessage {
    path: string;
    node: NodeType;
    message: string;
    severity: LintMessageSeverity;
}

export class ExecutionContext {
    private lintingMode: boolean;
    private lintMessages: Array<LintMessage>;

    constructor(public path: string) {
        this.lintingMode = false;
        this.lintMessages = [];
    }

    enableLinting(): void {
        this.lintingMode = true;
    }

    isLinting(): boolean {
        return this.lintingMode;
    }

    addLintMessage(message: LintMessage): void {
        this.lintMessages.push(message);
    }

    getLintMessages(): Array<LintMessage> {
        return this.lintMessages;
    }
}
