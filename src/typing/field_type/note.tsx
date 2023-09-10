import { Suspense } from "react";
import { gctx } from "src/context";
import { Visitors } from "src/language";
import { Note as NoteObject, Type } from "src/typing";
import { IComboboxOption, Pickers } from "src/ui";
import { field, parseLink, RenderLink } from "src/utilities";
import { FieldType } from "./base";

export class Note extends FieldType<Note> {
    name = "Note";

    static requiresDataview = true;

    @field()
    public typeNames: Array<string> = [];

    private _types: Array<Type> = null;

    @field({ required: false })
    public dv: string = null;

    @field({ required: false })
    public short: boolean = true;

    @field()
    public subpath: boolean = false;

    @field()
    public display: boolean = false;

    @field({ required: false })
    public relation: boolean = false;

    get types() {
        if (!this._types) {
            this._types = this.typeNames.map((name) => gctx.graph.get({ name })).filter((type) => type != null);
        }
        return this._types;
    }

    Display: FieldType["Display"] = ({ value }) => {
        let { path, subpath, display } = parseLink(value);
        if (!display) {
            // to not pass empty linkText to RenderLink
            display = null;
        }

        // TODO: supply current path: which one should it be?
        let resolved = gctx.app.metadataCache.getFirstLinkpathDest(path, "");
        path = resolved?.path ?? path;
        let note = new NoteObject(path);
        return (
            <a class="internal-link" href={note.path} tabIndex={-1}>
                <Suspense fallback={note.title}>
                    <RenderLink type={note.type} note={note} container={null} linkText={display} />
                </Suspense>
            </a>
        );
    };

    Picker = () => {
        const preview = (value: string) => <this.Display value={value} />;

        let options: IComboboxOption[] = Array.from(
            gctx.dv.pages(this.query).map(
                (p): IComboboxOption => ({
                    value: this.short ? p.file.name : p.file.path,
                    label: p.file.name,
                    display: preview,
                })
            )
        );
        return <Pickers.Note options={options} subpath={this.subpath} display={this.display} preview={preview} />;
    };

    get default() {
        return "";
    }

    private get query() {
        return this.types
            .filter((type) => type?.folder != null)
            .map((type) => `"${type.folder}"`)
            .join("|");
    }

    get isRelation() {
        return this.relation;
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            args: Visitors.Literal(
                Visitors.String.extend({
                    // TODO: check all types are valid and have folders
                    // TODO: autocomplete
                })
            ),
            kwargs: {
                dv: Visitors.Literal(Visitors.String),
                subpath: Visitors.Literal(Visitors.Boolean),
                display: Visitors.Literal(Visitors.Boolean),
                short: Visitors.Literal(Visitors.Boolean),
                relation: Visitors.Literal(Visitors.Boolean),
            },
            init(args, kwargs) {
                return Note.new({ typeNames: args, ...kwargs });
            },
        });
}
