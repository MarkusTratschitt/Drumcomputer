# Tag Dialog Flow

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: openTagDialog(itemId)
    Open --> Open: turn encoder (scroll tags)
    Open --> Open: press (add/remove tag)
    Open --> Closed: tilt right / closeTagDialog()
```

```mermaid
flowchart LR
    Import[importSelected()] --> Scan[scan tags]
    Scan --> Available[availableTags]
    Available --> Display[overlay lists + checkmarks]
```

- Tag overlay uses the existing display model without new UI elements.
