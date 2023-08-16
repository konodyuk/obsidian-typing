# CSS

With Typing, you can easily apply CSS styles or classes to note types.

## Applying CSS Classes to Notes

By default in Obsidian, CSS classes for a specific note can be assigned through its frontmatter like this:

```md
---
cssClasses: ["class-one", "class-two"]
---
```

In Typing, you can extend this functionality to apply CSS classes to an entire note type. Here's how:

```otl
type TypeName {
    style {
        css_classes = ["class-one", "class-two"]
    }
}
```

When you set it this way, the specified classes will be automatically applied to all notes of the type `TypeName`.

## Direct CSS Styling

Beyond just classes, Typing also allows you to directly integrate CSS code into your notes:

```otl
type TypeName {
    style {
        css = css"""
            & a {
                text-decoration: underline
            }
        """
    }
}
```

This `css` attribute utilizes [emotion](https://emotion.sh) for rendering. For advanced styling techniques and nuances, refer to the [emotion documentation](https://emotion.sh/docs/introduction).
