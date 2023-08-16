# Choice

A choice of multiple strings.

## Parameters

| Parameter       | Value Type                   | Description     |
| --------------- | ---------------------------- | --------------- |
| `...positional` | [STRING](../language#string) | Allowed options |

## Examples

```otl
type A {
    fields {
        status: Choice["open", "closed"] = "open"
    }
}
```

## Picker

@TODO
