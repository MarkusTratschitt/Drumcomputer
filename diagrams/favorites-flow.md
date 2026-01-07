# Favorites Flow

```mermaid
flowchart LR
    UI[User Toggle] --> Browser[toggleFavorite(id)]
    Browser --> Repo[LibraryRepository]
    Repo --> Store[localStorage set of ids]
    Browser --> Search[search(filters)]
    Search --> Results[filtered items]
    Results --> Display[subtitle with star]
```

- Favorites filtering is opt-in via `filters.favorites`.
