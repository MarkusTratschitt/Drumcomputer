# Persistence and Audio Flow

```mermaid
  flowchart TB
    UI[UI_and_Stores] -->|save patterns/scenes| LocalStorage
    UI -->|manage banks/samples| IndexedDB
    DefaultKit[DefaultKitLoader] --> IndexedDB
    ImportExport[ImportExportHelpers] -->|manifests + blobs| IndexedDB
    IndexedDB -->|rehydrate blobs| AudioEngine[AudioEngine+FX]
    AudioEngine -->|decode| AudioCache[AudioBufferCache]
    TransportEngine -->|onStep schedule| AudioEngine
    AudioEngine -->|mixdown/stems + metadata| Exporter[OfflineExport]
    Exporter -->|WAV + JSON| Downloader[DownloadHelpers]
```

## MK3 UI overlays hooked to persistence/audio (placeholders)

```mermaid
flowchart LR
  ScreenKnobs["Screen Knobs 1-8\n(hint + selector overlay)"] -->|grid length/div/swing| TransportStore
  ScreenKnobs -->|pad params| PatternsStore
  SoftButtons["Soft Buttons 1-8\n(symbol + hover hint)"] -->|scene/pattern select| PatternsStore
  ModeButtons["Mode Column\n(Scene/Pattern/Events/Variation/Duplicate/Select/Mute/Solo)"] --> PatternsStore
  TouchStrip["Touch Strip ≡\n(performance macro placeholder)"] --> AudioEngine
  Displays["Dual Displays\n(render metadata + presets)"] --> ImportExport
  TransportCluster["Transport Cluster\n(play/stop/rec/restart)"] --> TransportEngine
```

- All hardware placeholders must show hover hints describing what they write to (transport store, patterns store, audio engine) and list both primary + shift-layer actions.
- Keep overlays lightweight and clipped inside the 100vh hardware shell; any deeper lists (e.g., selector values) should scroll inside the display mock, not the page.
