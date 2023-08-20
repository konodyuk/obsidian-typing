import { App, Vault } from "obsidian";
import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { ExprScript } from "src/scripting";
import { FieldTypes, Type } from "src/typing";

beforeAll(async () => {
    gctx.testing = true;
    let app = new App(new Vault());
    let plugin = new TypingPlugin(app, null);
    await plugin.onload();
    await app.workspace.triggerLayoutReady();
});

function evaluateOTL(source: string): Record<string, Type> {
    let module = gctx.interpreter.importModule("test.otl", source);
    expect(module).toBeDefined();
    expect(module.env).toBeDefined();
    expect(module.error).toBeUndefined();
    return module.env;
}

function evaluateOTLErrors(source: string): Record<string, Type> {
    let module = gctx.interpreter.importModule("test.otl", source);
    expect(module).toBeDefined();
    expect(module.error).toBeDefined();
    return module.error;
}

test("empty type", () => {
    let { A } = evaluateOTL(`
type A {
}
`);
    expect(A).toBeDefined();
});

describe("type attributes", () => {
    test("folder", () => {
        let { A } = evaluateOTL(`
type A {
    folder = "typed/folder"
}
`);
        expect(A).toBeDefined();
        expect(A.folder).toBe("typed/folder");
    });

    test("icon", () => {
        let { A } = evaluateOTL(`
type A {
    icon = "fa fa-square"
}
`);
        expect(A).toBeDefined();
        expect(A.icon).toBe("fa fa-square");
    });

    test("prefix", () => {
        let { A } = evaluateOTL(`
type A {
    prefix = "MTN-{date_compact}"
}
`);
        expect(A).toBeDefined();
        expect(A.prefix?.template).toBe("MTN-{date_compact}");
    });
});

describe("fields", () => {
    test("regular identifier", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: String = "value"
    }
}
`);
        expect(A).toBeDefined();
        expect(A.fields).toBeDefined();
        expect(A.fields.field).toBeDefined();
        expect(A.fields.field.name).toBe("field");
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.String);
        expect(A.fields.field.default).toBe("value");
    });

    test("string identifier", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        "field name": String = "value"
    }
}
`);
        expect(A).toBeDefined();
        expect(A.fields).toBeDefined();
        expect(A.fields["field name"]).toBeDefined();
        expect(A.fields["field name"].name).toBe("field name");
        expect(A.fields["field name"].type).toBeInstanceOf(FieldTypes.String);
        expect(A.fields["field name"].default).toBe("value");
    });

    test("field type parameters", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Number[min=38, max=138]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Number);
        expect(A.fields.field.type.min).toBe(38);
        expect(A.fields.field.type.max).toBe(138);
    });

    test("field types", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        A: Number[]
        B: String
        C: Date
        D: Note
        E: Choice["one"]
    }
}
`);
        expect(A.fields.A.type).toBeInstanceOf(FieldTypes.Number);
        expect(A.fields.B.type).toBeInstanceOf(FieldTypes.String);
        expect(A.fields.C.type).toBeInstanceOf(FieldTypes.Date);
        expect(A.fields.D.type).toBeInstanceOf(FieldTypes.Note);
        expect(A.fields.E.type).toBeInstanceOf(FieldTypes.Choice);
    });
});

describe("field types parameters", () => {
    test("Number", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Number[min=-200, max=200]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Number);
        expect(A.fields.field.type.min).toBe(-200);
        expect(A.fields.field.type.max).toBe(200);
    });

    test("Choice", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Choice["A", "B", "C"]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Choice);
        expect(A.fields.field.type.options).toEqual(["A", "B", "C"]);
    });

    test("Tag", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Tag["A", "B", "C", dynamic=true]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Tag);
        expect(A.fields.field.type.options).toEqual(["A", "B", "C"]);
        expect(A.fields.field.type.dynamic).toBe(true);
    });

    test("Note", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Note["A", "B", "C"]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Note);
        expect(A.fields.field.type.typeNames).toEqual(["A", "B", "C"]);
    });

    test("String", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: String
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.String);
    });

    test("Date", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: Date
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.Date);
    });

    test("List", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: List[Note["A", "B"]]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.List);
        expect(A.fields.field.type.type).toBeInstanceOf(FieldTypes.Note);
    });

    test("File", () => {
        let { A } = evaluateOTL(`
type A {
    fields {
        field: File[kind="video", ext=["avi", "mkv"], folder="attachments", autorename=expr"(file)=>file.name"]
    }
}
`);
        expect(A.fields.field.type).toBeInstanceOf(FieldTypes.File);
        expect(A.fields.field.type.kind).toEqual("video");
        expect(A.fields.field.type.ext).toEqual(["avi", "mkv"]);
        expect(A.fields.field.type.folder).toEqual("attachments");
        expect(A.fields.field.type.autorename).toBeInstanceOf(ExprScript);
        expect(A.fields.field.type.autorename.call({})({ name: "kek" })).toEqual("kek");
    });
});

describe("style", () => {
    const marginals = ["header", "footer"];
    for (let marginal of marginals) {
        test(`fn ${marginal}`, () => {
            let { A } = evaluateOTL(`
type A {
    style {
        ${marginal} = fn"""
            return <div>header</div>
        """
    }
}
`);
            expect(A.style[marginal]).toBeDefined();
            expect(A.style[marginal].call({})).toBeDefined();
        });

        test(`expr ${marginal}`, () => {
            let { A } = evaluateOTL(`
type A {
    style {
        ${marginal} = expr"""
            <div>header</div>
        """
    }
}
`);
            expect(A.style[marginal]).toBeDefined();
            expect(A.style[marginal].call({})).toBeDefined();
        });

        test(`md ${marginal}`, () => {
            let { A } = evaluateOTL(`
type A {
    style {
        ${marginal} = md"""
            # Kek
            - one
        """
    }
}
`);
            expect(A.style[marginal]).toBeDefined();
            expect(A.style[marginal].source).toEqual("# Kek\n- one");
        });
    }

    test(`fn link`, () => {
        let { A } = evaluateOTL(`
type A {
    style {
        link = fn"""
            return <span>link</span>
        """
    }
}
`);
        expect(A.style.link).toBeDefined();
        expect(A.style.link.call({})).toBeDefined();
    });

    test(`expr link`, () => {
        let { A } = evaluateOTL(`
type A {
    style {
        link = expr"""
            <span>link</span>
        """
    }
}
`);
        expect(A.style.link).toBeDefined();
        expect(A.style.link.call({})).toBeDefined();
    });
});

test(`methods`, () => {
    let { A } = evaluateOTL(`
type A {
    methods {
        one = expr"""()=>{
            return 1
        }"""
        inc = expr"""(x)=>{
            return x + note.methods.one()
        }"""
    }
}
`);
    expect(A).toBeDefined();
    expect(A.methods).toBeDefined();
    expect(A.methods.one).toBeDefined();
    expect(A.methods.inc).toBeDefined();
});

test(`actions`, () => {
    let { A } = evaluateOTL(`
type A {
    actions {
        one = {
            name = "Action One"
            icon = "far fa-fire"
            script = fn"""
                console.log("i am action one")
            """
        }   
    }
}
`);
    expect(A).toBeDefined();
    expect(A.actions).toBeDefined();
    expect(A.actions.one.id).toEqual("one");
    expect(A.actions.one.name).toEqual("Action One");
    expect(A.actions.one.icon).toEqual("far fa-fire");
    expect(A.actions.one.script).toBeDefined();
});
