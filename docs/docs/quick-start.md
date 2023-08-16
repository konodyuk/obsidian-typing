---
title: Quick Start
---

# Quick Start: Movie Type

This guide outlines the foundational steps for configuring our plugin, ensuring you are equipped to utilize its core features.
By the end, you'll have established a basic movie management subsystem.

:::tip
Don't forget to enable the plugin after installation!
:::

## 1. Configuration File

The root schema of your vault, which serves as the primary configuration for the plugin, is stored in the `typing.otl` file located at the vault's root.

1. If the `typing.otl` file is absent, create it using the `Create Root Schema` command.
2. Open the file to access the OTL code editor where you can begin configuring the plugin.

## 2. Type Declaration: `Movie`

To start, define the `Movie` type:

```otl
type Movie {

}
```

To make this type functional, you must assign it to a specific folder.
The plugin relies on the designated folders to identify and process notes based on their respective types.
Here's how to specify the folder for our `Movie` type:

import SplitViewOTLPrompt from "../src/components/SplitView"

<SplitViewOTLPrompt group="movie" image="movie-prompt-1.png">

```otl
type Movie {
    // highlight-next-line
    folder = "typed/movies"
}
```

</SplitViewOTLPrompt>

Upon using the `Typing: Create` command, the `Movie` type will be available for selection.
Notes created under this type will be stored within the `typed/movies` folder.

Customize the `Movie` type with a recognizable icon and prefix:

<SplitViewOTLPrompt group="movie" image="movie-prompt-2.png">

```otl
type Movie {
    folder = "typed/movies"
    // highlight-next-line
    icon = "far fa-film"
    // highlight-next-line
    prefix = "MOV"
}
```

</SplitViewOTLPrompt>

:::info Icons & Prefixes
The `icon` parameter utilizes CSS classes from FontAwesome. While Obsidian Typing includes the FontAwesome Free collection,
users with FontAwesome Pro should adjust their settings to disable FontAwesome Free.
Explore the available icons on [FontAwesome](https://fontawesome.com/search).
:::

Notes of the `Movie` type will be prefixed with "MOV". For dynamic prefixing options, including time and serial numbers,
refer to our [Walkthrough](./walkthrough.md).

## 3. Adding Metadata to the Movie Type

The versatility of a type is enhanced by its metadata. Implement the following metadata fields for the `Movie` type:

<SplitViewOTLPrompt group="movie" image="movie-prompt-3.png">

```otl
type Movie {
    folder = "typed/movies"
    icon = "far fa-film"
    prefix = "MOV"

    // highlight-start
    fields {
        status: Choice["planned", "watched"] = "planned"
        priority: Number[min=1, max=5] = 2
        rating: Number[min=1, max=10]
        country: Tag[dynamic=true]
        year: Number[min=1900, max=2100]
        director: Tag[dynamic=true]
        cast: List[Tag[dynamic=true]]
        tags: List[Tag[dynamic=true]]
    }
    // highlight-end
}
```

</SplitViewOTLPrompt>

:::tip Field Types
Explore the available field types in the [Field Types Reference](/docs/category/field-types).
:::

## 4. Creating a Movie App

With the `Movie` type established, you can now create a view note to use as an entrypoint to the movie management subsystem.
Use dataview queries for organization and display:

````md
# Movies

## Planned

```dataview
TABLE priority as "pri", country, year, tags, director from "typed/movies"
WHERE status = "planned"
SORT pri DESC
```

## Watched

```dataview
TABLE rating, country, year, tags, director from "typed/movies"
WHERE status = "watched"
SORT rating DESC
```
````

:::success Next Steps
You have successfully configured a basic movie management subsystem with our plugin.
To delve deeper into advanced features, proceed to our [Walkthrough](./walkthrough.md).
:::
