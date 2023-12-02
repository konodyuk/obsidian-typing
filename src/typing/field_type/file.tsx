import { TFile, TFolder, Vault } from "obsidian";
import { gctx } from "src/context";
import { Visitors } from "src/language";
import { Script } from "src/scripting";
import { IComboboxOption, Pickers } from "src/ui";
import { field, parseLinkExtended } from "src/utilities";
import { FieldType } from "./base";

export class File extends FieldType<File> {
    name = "File";

    @field()
    upload: boolean = true;
    @field()
    search: boolean = true;
    @field()
    subpath: boolean = false;
    @field()
    display: boolean = false;
    @field()
    rename: boolean = false;
    @field()
    short: boolean = false;

    @field()
    folder: string = "files";

    @field()
    accept: string = null;

    @field()
    ext: string[] = null;

    @field()
    kind: "video" | "audio" | "image" | "document" = null;

    @field()
    capture: string | boolean = null;

    @field()
    autorename: Script = null;

    Display: FieldType["Display"] = ({ value }) => {
        if (typeof value != "string") value = value.markdown();
        let { name, extension, display, path } = parseLinkExtended(value);

        return (
            <a className="internal-link" href={path}>
                {display || name}
                {extension && <kbd>{extension}</kbd>}
            </a>
        );
    };

    Picker = () => {
        const preview = (value: string) => <this.Display value={value} />;
        let paths: IComboboxOption[] = [];
        if (this.ext) {
            let folder = gctx.app.vault.getAbstractFileByPath(this.folder);
            if (folder && folder instanceof TFolder) {
                Vault.recurseChildren(folder, (file) => {
                    if (!file || !(file instanceof TFile)) return;
                    if (!this.ext.includes(file.extension)) return;
                    let relativePath = file.path.slice(folder.path.length + 1); // plus one slash
                    paths.push({ value: relativePath, display: preview });
                });
            }
        }

        return (
            <Pickers.File
                paths={paths}
                folder={this.folder}
                accept={this.accept}
                capture={this.capture}
                autoRename={this.autorename?.call({})}
                upload={this.upload}
                preview={preview}
                subpath={this.subpath}
                display={this.display}
                short={this.short}
                search={this.search}
            />
        );
    };

    get default() {
        return "";
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            kwargs: {
                accept: Visitors.Literal(Visitors.String),
                capture: Visitors.Literal(Visitors.Union(Visitors.String, Visitors.Boolean)),
                ext: Visitors.Literal(Visitors.Union(Visitors.String, Visitors.List(Visitors.String))),
                kind: Visitors.Literal(Visitors.LiteralString(["video", "audio", "image", "document"])),
                folder: Visitors.Literal(Visitors.String),
                autorename: Visitors.Literal(Visitors.ExprScriptString("(file)=>{return ${file.name}}")),
                upload: Visitors.Literal(Visitors.Boolean),
                search: Visitors.Literal(Visitors.Boolean),
                subpath: Visitors.Literal(Visitors.Boolean),
                display: Visitors.Literal(Visitors.Boolean),
                // rename: Visitors.Literal(Visitors.Boolean),
                short: Visitors.Literal(Visitors.Boolean),
            },
            init(args, kwargs) {
                if (kwargs.ext != null) {
                    if (!Array.isArray(kwargs.ext)) {
                        kwargs.ext = [kwargs.ext];
                    }
                    kwargs.ext = kwargs.ext.map((x: string) => {
                        while (x.startsWith(".")) x = x.slice(1);
                        x = x.toLowerCase();
                        return x;
                    });
                }
                return File.new(kwargs);
            },
        });
}
