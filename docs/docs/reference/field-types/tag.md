# Tag

Same as [Choice](./choice.md), but allows creating new values and suggests all values specified in this field
in the notes of the type.

## Parameters

| Parameter       | Value Type                     | Description                                                                           |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `...positional` | [STRING](../language#string)   | Default options                                                                       |
| `dynamic`       | [BOOLEAN](../language#boolean) | If `true`, aggregates all available options for the given field inside the given type |
| `dv`            | [STRING](../language#string)   | Custom dataview scope for collecting tag values                                       |

## Examples

```otl
type A {
    fields {
        country: Tag[dynamic=true]
    }
}
```

## Picker

@TODO
