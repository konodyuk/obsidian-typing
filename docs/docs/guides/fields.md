# Fields

Fields in Obsidian are widely used to incorporate metadata into notes, either as frontmatter or inline fields.
Obsidian Typing enhances this by allowing you to define a precise schema for note types,
specifying which fields they can have and the data types of these fields.

## Configuration Syntax

To define fields, use the `fields` section:

```otl-grammar
type TypeName {
    fields {
        // field_name: FieldType = "default value"
        <#LOOSE_IDENTIFIER>: <#FIELD_TYPE> [= <#STRING>]
        ...
    }
}
```

### Field Name

For standard field names, use regular identifiers. For names with special characters or spaces, use string identifiers:

```otl
type TypeName {
    fields {
        i_am_a_normal_identifier: String
        "i have spaces": Number
        "symbols like 官話 are included": List[Number]
    }
}
```

### Field Type

The type determines the kind of data stored in the field and the picker used for it.
They are specified as `TypeName` if they either have no parameters or if parameters aren't declared.
If they do have parameters, they are specified as `TypeName[<positional params>, <keyword params>]`.

Examples:

```otl
type TypeName {
    fields {
        field0: String // no parameters
        field1: Note["Type1", "Type2"] // positional parameters only
        field2: Number[min=2, max=3] // keyword parameters only
        field3: Tag["value1", "value2", dynamic=true] // both types of parameters
        field4: List[Note["Type3"]] // type as a positional parameter
    }
}
```

:::tip
For a comprehensive list of field types and their respective parameters, visit the [Field Types Reference](/docs/category/field-types).
:::

### Default Value

Set a default field value for it to be automatically used during new note creation:

```otl
type TypeName {
    fields {
        status: Choice["open", "closed"] = "open"
    }
}
```

## Inline Fields

Obsidian Typing uses [inline fields](https://blacksmithgu.github.io/obsidian-dataview/annotation/add-metadata/#inline-fields)
for field value storageto store field values, letting users embed metadata directly in the note content.
Consult the Dataview documentation for details on this format.

:::info
Currently, we don't support frontmatter fields. Instead, we advocate for their storage within the note body.
This is because Obsidian does not recognize or auto-rename internal links in frontmatter. We anticipate this
changing in future updates, after which we'll introduce settings to determine the storage location of each field.
:::

## Hiding Fields

If you want to streamline your notes' appearance (e.g. with [headers](./header-footer.md)), you can hide inline fields.
The visibility can be controlled using the `style.hide_inline_fields` attribute:

```otl
type TypeName {
    style {
        hide_inline_fields = "all"
    }
}
```

Options:

-   `"none"` (default) - all fields are visible.
-   `"all"` - conceals every inline field.
-   `"defined"` - obscures only the specified fields in the type.

## UI Prompts

After defining field names and types, Obsidian Typing generates intuitive prompts.
These enable note creation via the `New` command and metadata modification through the `Change Name and Fields` command.
This prompt also appears when clicking the note title, similar to renaming a note without this plugin.

### Example

import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";
import Image from "@theme/IdealImage";
import CodeBlock from "@theme/CodeBlock";
import { dedent } from "@site/src/utils/dedent";
import useBaseUrl from "@docusaurus/useBaseUrl";

<Tabs>
    <TabItem value="otl" label="OTL">
        <CodeBlock language="otl">
            {dedent(`
            type Issue {
                folder = "typed/issues"
                fields {
                    status: Choice["backlog", "open", "closed"] = "backlog"
                    priority: Number[min=1, max=5] = 2
                    in: Note["Project", "Issue"]
                    deps: List[Note["Issue"]]
                    tags: List[Tag[dynamic=true]]
                    due: Date
                }
            }
        `)}
        </CodeBlock>
    </TabItem>
    <TabItem value="prompt-new" label="Prompt for New">
        <center>
            <img className="imgDemo" src={useBaseUrl("/img/issue-prompt-1-3.png")} />
        </center>
    </TabItem>
</Tabs>
