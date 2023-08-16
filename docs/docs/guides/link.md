---
title: Links
---

# Interactive Links

Enhance your internal links by rendering custom React components, having a more interactive and expressive user experience.

## Configuration Syntax

Specify the style for links within the style section as follows:

```otl-grammar
type TypeName {
    style {
        link = <#FUNCTION | #EXPR>
    }
}
```

## Defining React Links

Similar to [headers and footers](./header-footer.md), there are two primary methods to define them:

### 1. Function Approach

Use the `fn` or `function` tag to script a function that returns a React component:

```otl
type TypeName {
    style {
        link = fn"""
            import {Anything} from "anywhere"
            // process as required
            return <Anything>{any <b>react</b> element}</Anything>
        """
    }
}
```

### 2. Expression Approach

For simpler, one-liner components, use the `expr` tag:

```otl
type TypeName {
    style {
        link = expr"""
            <>
                <span className={note.methods.iconClass()} />
                {ctx.linkText ?? note.title}
            </>
        """
    }
}
```

### Context Variables

#### Static Context

Accessible in every `fn` and `expr`:

-   `note`: The current `Note` object.
-   `api`: The global `TypingAPI` object.

#### Dynamic Context

Contained within the `ctx` object with the following properties:

-   `container`: The HTML container designated for the link.
-   `linkText`: Displayed link text (e.g., in `[[path|linkText]]`) or `null` if unspecified.

## Example

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
            type Person {
                style {
                    link = fn"""
                        import {Container, Avatar, Icon} from "./utils.tsx"
                        const abbrev = note.page.name[0] + note.page.surname[0];
                        const photo = note.methods.photo();
                        if (photo)
                            return <Container><Avatar src={src} />{abbrev}</Container>;
                        }
                        return <Container><Icon className="far fa-user" />{abbrev}</Container>;
                    """
                }
                methods {
                    photo = fn"""() => {
                        const page = note.page
                        if (!page.photo) return;
                        const vault = api.app.vault;
                        const tfile = vault.getAbstractFileByPath(page.photo.path)
                        if (!tfile) return;
                        return vault.getResourcePath(tfile)
                    }"""
                }
            }
        `)}
        </CodeBlock>
    </TabItem>
    <TabItem value="source" label="Source View">
        <CodeBlock language="markdown">
            {dedent(`
            - Discussed [[PRJ Project One]] with [[@ElonMusk]] and [[@JohnDoe]]
        `)}
        </CodeBlock>
    </TabItem>
    <TabItem value="preview" label="Preview View">
        <img className="imgDemo" src={useBaseUrl("/img/links-1.png")} />
    </TabItem>
</Tabs>
