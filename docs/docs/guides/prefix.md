# Prefix

Title prefixes provide a customizable way to name notes.
Those familiar with Obsidian's `Unique note creator` core plugin will recognize the concept of Zettelkasten prefixes.
Notes created via this plugin in Obsidian might appear as `202308120833 Note Title.md` or `202308120833.md`.

In Typing, the idea behind prefixes remains the same: enable notes of specific types to have unique names:

1. To ensure short links work consistently.
2. To streamline the process of writing internal links (for example, typing `[[PRJ ` will auto-complete all the projects).
3. To sometimes serve as a handy unique identifier, akin to GitHub Issues.

To set a title prefix for a type, use this syntax:

```otl
type TypeName {
    prefix = "PREFIX_CONTENT"
}
```

`PREFIX_CONTENT` can be made up of:

1. Interpolations: dynamic segments like `{interpolation_name}`.
2. Regular text: any text that isn't an interpolation.

You can combine these in various ways:

-   `{just_interpolation}`
-   `just-text`
-   `text-and-{interpolation}`
-   `text-and-{interpolation}-and-{other_interpolation}`

## Supported Interpolations

### `{serial}`

This represents the serial number of the note of a specific type. So, if you set the prefix as `P{serial}`, your notes will start with:

-   `P1`
-   `P2`
-   `P3`
-   ...

### `{date_compact}`

This represents the current datetime, accurate to one second. It's compressed to a string of 6-7 characters
(currently always 6, but will become 7 in 2062). With the prefix `A-{date_compact}`, note names depend on their creation time, for example:

-   `A-M1A9WM`
-   `A-N6BF3d`
-   `A-N869mz`

More interpolations may be introduced in upcoming updates if requested.
In the future, other plugins will have a way to register custom interpolations.

## Examples

```otl
type Meeting {
    folder = "typed/meeting"
    prefix = "MTN-{serial}"
}
```

```otl
type Event {
    folder = "typed/event"
    prefix = "E-{serial}"
}
```

```otl
type Zettelkasten {
    folder = "typed/zettelkasten"
    prefix = "ZK-{date_compact}"
}
```
