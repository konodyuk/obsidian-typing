# Note

An internal link. Filters note suggestions based either on their type or on custom dataview queries.

## Parameters

| Parameter       | Value Type                     | Description                      |
| --------------- | ------------------------------ | -------------------------------- |
| `...positional` | [STRING](../language#string)   | Allowed field types              |
| `dv`            | [STRING](../language#string)   | Custom dataview query            |
| `relation`      | [BOOLEAN](../language#boolean) | Whether this field is a relation |

## Examples

```otl
type A {
    fields {
        parent: Note["A"]
        deps: List[Note["A", "B", "C"]]
    }
}
```

## Picker

@TODO
