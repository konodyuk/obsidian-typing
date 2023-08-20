import { Prefix } from "src/typing/prefix";

test("smoke date_compact", () => {
    let prefix = Prefix.new({ template: "PEP-{date_compact}" });
    expect(prefix.parse("PEP-B95Axx temp")).toEqual({
        prefix: "PEP-B95Axx",
        name: "temp",
        interpolations: ["B95Axx"],
    });
    expect(prefix.parse("PEP-B95Axz temp")).toEqual({
        prefix: "",
        name: "PEP-B95Axz temp",
        interpolations: [],
    });
});
