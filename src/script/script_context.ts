import { Fragment, h, render } from "preact";
import { useState } from "preact/hooks";
import styled from "styled-components";
import { ctx } from "../context";
import { Note } from "../typing/note";

export type ContextType = Record<string, any>;

export function createBaseContext(): ContextType {
    return {
        app: ctx.app,
        plugin: ctx.plugin,
        dv: ctx.dv,
        registry: ctx.registry,
        Note: (path: string) => new Note(path),
        Type: (name: string) => ctx.registry.byName(name),
        include: async (path: string) =>
            await ctx.include_manager.include(path),
        h: h,
        Fragment: Fragment,
        useState: useState,
        render: render,
        styled: styled,
    };
}

export function contextToPreamble(context: ContextType): string {
    let result = "";
    for (let key in context) {
        result += `let ${key} = this["${key}"];`;
    }
    return result;
}
