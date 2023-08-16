# Number

Just an integer value.

## Parameters

| Parameter            | Value Type                   | Description       |
| -------------------- | ---------------------------- | ----------------- |
| `min` (default `0`)  | [NUMBER](../language#number) | Min allowed value |
| `max` (default `10`) | [NUMBER](../language#number) | Max allowed value |

## Examples

```otl
type A {
    fields {
        rating: Number[min=0, max=5]
        some_number: Number
    }
}
```

## Picker

@TODO
