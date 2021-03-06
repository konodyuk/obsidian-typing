![](https://github.com/konodyuk/obsidian-typing/blob/master/static/side_by_side.png?raw=true)

# Obsidian Typing

The plugin provides strict note typing. Types in Obsidian are now very much like classes in programming. You just define name of new type and the folder where notes of this type will be located. Then you can define a lot of useful properties that will persist only on notes of this type, such as:

-   DataView fields and their types
-   Fast actions
-   Dynamic header and footer
-   Link icon or fully custom link rendering
-   Autogenerated name prefix (e.g. based on date or serial number)
-   Initialization list (constructor): list of properties that will be prompted before note creation
-   Other stuff

## Installation

The plugin hasn't been released yet, thus it can be installed only manually, i.e. by copying `main.js`, `styles.css`, `manifest.json` to `VaultFolder/.obsidian/plugins/obsidian-typing/`.

## Getting started

Explore the [`example_vault`](https://github.com/konodyuk/obsidian-typing/tree/master/example_vault) to experience the features of Typing. The docs will also appear soon.

## Configuration

Typing is configured with `typing.yaml` file in the root of your vault. See [`example_vault/typing.yaml`](https://github.com/konodyuk/obsidian-typing/blob/master/example_vault/typing.yaml) for usage examples.

The schema is roughly the following:

```yaml
types:
    - name: string # type name
      folder: string # folder where notes are located
      header?: # script generating header; only one of file and source should be specified
          file?: string # file where the script is located
          source?: string # script source
      footer?: # script generating footer; only one of file and source should be specified
          file?: string # file where the script is located
          source?: string # script source
      icon?: string # icon CSS class
      fields?: # list of dataview fields
          - name: string # field name
            kind: string # field type, one of [any, link, link_list, choice]
      actions?: # list of fast actions
          - name: string # action name
            display:
                icon?: string # icon CSS class
                name?: string # text that should appear instead of icon
            file?: string # file where the script is located
            source?: string # script source
          - string # actions can also be inserted from action pool by slug
      prefix?: string # prefix format
      parents?: [string] # inheritance list: list of names of classes whose fields, icons, footers and headers should be inherited
      init?: [string] # type constructor: list of properties that should be prompted while creation

overrides: # list of alterations that modify the note's properties in certain conditions
    - condition: string # js expression returning binary value
      icon?: string # replacement icon
      header?: # replacement header
          file?: string
          source?: string
      footer?: # replacement footer
          file?: string
          source?: string

actions: # fast actions
    string: # action slug, used for compact insertion into type definitions
        name: string
        display:
            icon?: string
            name?: string
        source?: string
        file?: string
        pinned?: boolean # whether the action is pinned

settings:
    preamble: # preamble that will be added to each script; use it to define utility functions
        source?: string
        file?: string
```

## Commands

### New

Creates a note of chosen type, prompting the name and all fields or only those defined in init list if it is specified.

### Set Field

Prompts and sets the field of open note.

### Open Actions

Opens fast actions of open note. Also available through icon in title bar.

### Find

**Currently disabled:** will be reimplemented to support search through metadata.

Opens a search through all notes of chosen type. Opens the selected note is called in preview mode and inserts the link if called in edit mode.

## Known Issues

-   Field types are currently disabled, they'll be returned when [Find](#find) command is reimplemented. Currently field types are ignored and they're all prompted as plain text fields.
