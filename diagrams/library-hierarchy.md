# Category/Product/Bank Hierarchy

```mermaid
flowchart TD
    Import[importDirectory] --> Meta[extractMetadataFromPath]
    Meta --> Items[Library items]
    Items --> Cats[getCategories]
    Items --> Prods[getProducts category]
    Items --> Banks[getBanks product]
    Items --> Subs[getSubBanks bank]
    Cats --> Filters[applyFilters]
    Prods --> Filters
    Banks --> Filters
    Subs --> Filters
```

- Hierarchy queries are filtered by their parent selection.
