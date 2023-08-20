export const hookCalls = [];

export function appendHookCall(hookName, ctx) {
    hookCalls.push({ hookName, ctx });
}
