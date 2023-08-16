# File

A file to either choose from vault or upload.

## Parameters

| Parameter                 | Value Type                                                                               | Description                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `ext`                     | [STRING](../language#string) \| [ARRAY](../language#array)<[STRING](../language#string)> | Allowed file extensions                       |
| `type`                    | `"image"`\|`"video"`\|`"audio"`\|`"document"`                                            | Allowed file kinds                            |
| `search` (default `true`) | [BOOLEAN](../language#boolean)                                                           | Enables or disables search for existing files |
| `upload` (default `true`) | [BOOLEAN](../language#boolean)                                                           | Enables or disables new file upload           |

## Examples

```otl
type A {
    fields {
        photo: File[type="image"]
        docs: List[File[ext=["pdf", "epub"]]]
    }
}
```

## Picker

@TODO
