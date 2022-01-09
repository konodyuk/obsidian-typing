import { Notice } from "obsidian";

export function warn(message: string) {
    new Notice("Typing Warning: " + message);
    console.log("Typing Warning: " + message);
}
