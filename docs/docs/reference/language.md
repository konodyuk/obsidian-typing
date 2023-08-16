# OTL Language

## Grammar

```otl-grammar
import {<#LOOSE_IDENTIFIER>, <#LOOSE_IDENTIFIER>} from <#STRING>

type <#LOOSE_IDENTIFIER> [extends <#LOOSE_IDENTIFIER>, ...] {
    folder = <#STRING>
    icon = <#STRING>
    prefix = <#STRING>

    fields {
        // field_name: FieldType = "default value"
        <#LOOSE_IDENTIFIER>: <#FIELD_TYPE> [= <#STRING>]
        ...
    }

    style {
        header = <#FUNCTION | #EXPR | #MARKDOWN>
        footer = <#FUNCTION | #EXPR | #MARKDOWN>
        link = <#FUNCTION | #EXPR>
        show_prefix = <#STRING>
        css_classes = <#ARRAY<#STRING>>
        css = <#CSS>
    }

    actions {
        <#IDENTIFIER> = {
            name = <#STRING>
            shortcut = <#STRING>
            description = <#STRING>
            script = <#FUNCTION>
        }
        ...
    }

    methods {
        <#IDENTIFIER> = <#EXPR>
        ...
    }

    hooks {
        create = <#FUNCTION>

        on_create = <#FUNCTION>
        on_rename = <#FUNCTION>
        on_remove = <#FUNCTION>

        on_open = <#FUNCTION>
        on_close = <#FUNCTION>

        on_type_change = <#FUNCTION>
        on_metadata_change = <#FUNCTION>
    }
}
```

---

## Identifiers

### Identifier

A basic naming convention without spaces, beginning with a letter or an underscore. It comprises letters, underscores, and digits.

Examples:

-   `TypeName`
-   `_TypeName`
-   `T_Y_P_3_N_4_M_3` (don't do this though).

### String Identifier

A more flexible identifier encapsulated within a [String](#string), allowing for spaces and characters outside the Latin alphabet.

Examples:

-   `"Type Name With Spaces"`
-   `"Type Name Containing 官話"`

### Loose Identifier

A combination of both [Identifiers](#identifier) and [String Identifiers](#string-identifier), offering flexibility in naming.

Examples:

-   `TypeName`
-   `"Type Name With Spaces"`

---

## Literal Values {#literal}

### String

String value in single or double quotes. For multiline strings use 3 quotes.

Examples:

-   `"single line double quote string"`
-   `'single line single quote string'`
-   ```
    """
    multi line
    double quote string
    """
    ```
-   ```
    '''
    multi line
    single quote string
    '''
    ```

### Number

Integer or floating point number.

Examples:

-   `1`
-   `10000`
-   `2.71828`

### Boolean

Boolean value.

Examples:

-   `true`
-   `false`

### Array

Multiple values of specified type.

Examples:

-   `[1, 2, 3]`
-   `["css-class-1", "css-class-2"]`

### Object

Key-value container.

Examples:

-   ```
    {
        name = "Action Name"
        shortcut = "a"
        script = function"""
            import {do_something} from "something"
            do_something()
        """
    }
    ```

---

## Tagged Strings

Tagged string consists of a [String](#string) prefixed with a tag ([Identifier](#identifier)).

Examples:

-   `tag"string"`
-   ```
    some_tag"""
    multi line
    double quote string
    """
    ```

The tags allow string values to be interpreted differently than regular strings.
Below are the specifications of available tags.

### Function String {#function}

Prefixed with `function` or `fn` .

Defines a function body. The function may or may not return something. The function can access the following variables: `api`, `ctx`, `note`.

Examples:

-   ```
    fn"""
        import { Breadcrumb } from "./utils/breadcrumb"
        return <Breadcrumb note={note} />
    """
    ```
-   ```
    fn"""
        import { do_something, return_nothing } from "./something"
        do_something(ctx)
        return_nothing()
    """
    ```

### Expression String {#expr}

Prefixed with `expr`.

Defines a single line expression which is evaluated into value.
You can think of it as of a single-line function where `return` is omitted.
The following values are equivalent:

-   `fn"return 1 + 2"`
-   `expr"1 + 2"`

Examples:

-   `expr"api.import('utils').fileRenamer"`
-   ```
    expr"""(a, b, c) => {
        // method body
    }"""
    ```

### Markdown String {#markdown}

Prefixed with `markdown` or `md`.

Defines a markdown content. Exists for convenience, e.g. highlighting.

Examples:

-   ````
    md"""
        ## Comments
        ```dataview
        TASK FROM "typed/journal"
        WHERE status = "C"
        ```
    """
    ````

### CSS String {#markdown}

Prefixed with `css`.

Defines CSS content.

Examples:

-   ```
    css"""
        width: 100%;

        & p {
            background: blue;
        }
    """
    ```

---

## Field Types {#field-type}

Field types are grammatically specified as:

```otl-grammar
- #IDENTIFIER
- #IDENTIFIER[#LITERAL|#FIELD_TYPE, #LITERAL|#FIELD_TYPE, ...]
- #IDENTIFIER[#IDENTIFIER=#LITERAL|#FIELD_TYPE, #IDENTIFIER=#LITERAL|#FIELD_TYPE, ...]
- #IDENTIFIER[#LITERAL|#FIELD_TYPE, #LITERAL|#FIELD_TYPE, ..., #IDENTIFIER=#LITERAL|#FIELD_TYPE, #IDENTIFIER=#LITERAL|#FIELD_TYPE, ...]`}</CodeBlock2>
```

:::info
See the reference to field types in [Field Types](/docs/category/field-types)
:::

## Example

````otl
import { "Imported Type" } from "../relative/path"
import { ImportedType2 } from "absolute/path/in/vault/to/file.ts"

type A extends "Imported Type", ImportedType2 {
    folder = "typed/a"
    icon = "far fa-a"
    prefix = "A-{date_compact}"

    style {
        header = function"""
            import {Breadcrumb} from "./breadcrumb"
            return <Breadcrumb note={note} />
        """
        footer = markdown"""
            ## Comments
            ```dataview
            TASK FROM "typed/journal"
            WHERE status = "C"
            ```
        """
        link = expr"""<span class="fancy-link">{ctx.linkText}</span>"""
        show_prefix = "always"
        css_classes = ["one", "two", "three"]
        css = css"""
            width: 100%;

            & p {
                background: blue;
            }
        """
    }

    fields {
        a: Number = 1
        b: Choice["a", "b", "c"] = "c"
        c: Number[min=1, max=12] = 10
        e: String
        f: Tag[dynamic=True]
        g: List[Tag[dynamic=True]]
        h: Tag["a", "b", "c"]
        i: List[Tag["a", "b", "c"]]
        j: Tag["a", "b", "c", dynamic=True]
        k: TagList["a", "b", "c", dynamic=True]
        l: List[Number[min=1, max=12]]
        m: List[Choice["a", "b", "c"]]
        "n": Note["B"]
        o: List[Note["B", "C"]]
    }

    actions {
        one = {
            name = "Action One"
            shortcut = "a"
            script = function"""
                import {do_something} from "something"
                do_something()
            """
        }
    }

    hooks {
        create = function""""""

        on_create = function""""""
        on_rename = function""""""
        on_remove = function""""""

        on_open = function""""""
        on_close = function""""""

        on_type_change = function""""""
        on_metadata_change = function""""""
    }

    methods {
        method_one = expr"""() => {
            return 1
        }"""
        method_two = expr"""(a, b) => {
            return a + b + note.methods.method_one()
        }"""
    }
}

type "B" extends "A" {}
type default {}
````
