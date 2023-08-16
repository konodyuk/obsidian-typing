# List

A generic type: list of values of any other type.

## Parameters

| Parameter    | Value Type                           | Description      |
| ------------ | ------------------------------------ | ---------------- |
| `positional` | [FIELD_TYPE](../language#field-type) | Value field type |

## Examples

```otl
type A {
    fields {
        list_str: List[String]
        list_num: List[Number[max=3]]
        list_tag: List[Tag[dynamic=true]]
        list_note: List[Note["Type1", "Type2"]]
    }
}
```

## Picker

@TODO
