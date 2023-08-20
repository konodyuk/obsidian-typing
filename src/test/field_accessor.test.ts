import { StringFieldAccessor } from "src/middleware/field_accessor";
import { Field, FieldTypes, Type } from "src/typing";
import { dedent } from "src/utilities/dedent";

async function testAccessor(
    type: Type,
    content: string,
    { key, value }: { key: string; value: string },
    output: string
) {
    let accessor = new StringFieldAccessor(content, type);
    await accessor.setValue(key, value);
    expect(accessor.content).toBe(output);
}

function defineType(fields: string[]) {
    const result = {
        name: "Test",
        fields: {},
    };
    for (let field of fields) {
        result.fields[field] = Field.new({ name: field, type: FieldTypes.String.new() });
    }
    return Type.new(result);
}

// Helper function to run a test
async function runTest(
    typeFields: string[],
    initialContent: string,
    action: { key: string; value: string },
    expectedOutput: string
) {
    const type = defineType(typeFields);
    await testAccessor(type, initialContent, action, expectedOutput);
}

// Test cases
test("set fields at the top", async () => {
    await runTest(
        ["alpha"],
        "content",
        { key: "alpha", value: "A" },
        dedent(`
            alpha :: A

            content
        `)
    );
});

test("remove fields if null", async () => {
    await runTest(
        ["beta"],
        dedent(`
            beta :: B

            content
        `),
        { key: "beta", value: null },
        "content"
    );
});

test("insert in order", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            beta :: B
            alpha :: A
        `),
        { key: "charlie", value: "C" },
        dedent(`
            beta :: B
            alpha :: A
            charlie :: C
        `)
    );
});

test("insert before field block", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            beta :: B
            alpha :: A

            gamma :: G
        `),
        { key: "charlie", value: "C" },
        dedent(`
            beta :: B
            alpha :: A
            charlie :: C

            gamma :: G
        `)
    );
});

test("remove before other field block", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            beta :: B
            alpha :: A
            charlie :: C

            gamma :: G
        `),
        { key: "charlie", value: null },
        dedent(`
            beta :: B
            alpha :: A
            gamma :: G
        `)
    );
});

test("modify existing in 2nd field block", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            beta :: B

            alpha :: A
            gamma :: G
        `),
        { key: "alpha", value: "AA" },
        dedent(`
            beta :: B

            alpha :: AA
            gamma :: G
        `)
    );
});

test("insert existing into 2 field blocks", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            alpha :: A

            beta :: B
        `),
        { key: "charlie", value: "C" },
        dedent(`
            alpha :: A
            charlie :: C

            beta :: B
        `)
    );
});

test("insert between", async () => {
    await runTest(
        ["alpha", "beta", "charlie"],
        dedent(`
            alpha :: A
            charlie :: C
        `),
        { key: "beta", value: "B" },
        dedent(`
            alpha :: A
            beta :: B
            charlie :: C
        `)
    );
});

test("fields not in schema appear under", async () => {
    await runTest(
        ["delta", "beta"],
        dedent(`
            delta :: D
            beta :: B
        `),
        { key: "alpha", value: "A" },
        dedent(`
            delta :: D
            beta :: B
            alpha :: A
        `)
    );
});
test("insert field with multiple non-schema fields", async () => {
    await runTest(
        ["alpha"],
        dedent(`
            gamma :: G
            epsilon :: E
        `),
        { key: "alpha", value: "A" },
        dedent(`
            gamma :: G
            epsilon :: E
            alpha :: A
        `)
    );
});
test("fields at beginning and end with no content", async () => {
    await runTest(
        ["alpha", "beta"],
        "alpha :: A",
        { key: "beta", value: "B" },
        dedent(`
            alpha :: A
            beta :: B
        `)
    );
});
