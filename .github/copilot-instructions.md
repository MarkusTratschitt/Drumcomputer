# Copilot Instructions for Drumcomputer

## Projektüberblick
- Nuxt 4 Drumcomputer mit Vue 3 Options API, TypeScript (strict), Vuetify 3 (Pug + Less), Web Audio, Web MIDI und IndexedDB.
- Hauptkomponenten: PadGrid, PadCell, DrumMachine, TransportBar, FxPopup, Panels (Sound, FX, Patterns, Export).
- Audio-Engine: Lookahead-Scheduler, quantisierte Aufnahme, 16-Pad-Sequencer, FX-Chain (Filter/Drive/Reverb), deterministische Exporte mit Seed.
- Persistenz: Soundbanks, Patterns und Samples werden in IndexedDB gespeichert und beim Laden rehydriert.
- MIDI: Mapping, Clock (Master/Slave), WebMIDI-Capabilities, Sync-Panel.

## Wichtige Workflows
- **Entwicklung:**
  - `npm install` – Abhängigkeiten installieren
  - `npm run dev` – Entwicklungsserver starten
  - `npm run lint` – Linting
  - `npm run typecheck` – TypeScript-Checks
- **Port/HMR anpassen:**
  - Beispiel: `PORT=3001 HMR_PORT=24679 npm run dev`
- **Tests:**
  - Komponententests: `tests/componentTests/`
  - Unittests: `tests/unitTests/`
- **Export:**
  - Audio-Export via ExportPanel, deterministisch mit Seed und Metadaten (siehe `useImportExport` und `exportAudio`).

## Architektur & Patterns
- **Stores:** Pinia für Transport, Patterns, Session, Soundbanks (`stores/`)
- **Composables:** Audio, Scheduler, Sequencer, MIDI, Sync, Import/Export, Soundbank-Storage (`composables/`)
- **Domain-Logik:** Timing, Quantisierung, Velocity, Transport, Clock, FX (`domain/`)
- **Diagrams:** Architektur, Transport, UI, Persistenz (`diagrams/`)
- **Persistenz:** IndexedDB für Soundbanks/Samples/Patterns, LocalStorage für Patterns/Scenes (v2 Schema)
- **UI:** Responsive, 16-Pad-Grid, Transport, FX, Panels (Pattern, Export, Sound, FX)
- **Export:** Mixdown + Stems, Metadaten-Blob, deterministische Reproduktion via Seed

## Konventionen & Besonderheiten
- **AudioContext** ist die einzige Zeitquelle (auch für MIDI-Clock).
- **Undo/Redo:** 50 Schritte für Pattern/Scene-Edits, persistiert mit Auswahl.
- **Capability Gates:** UI zeigt WebMIDI/Audio-In-Support an.
- **Import/Export:** JSON/MIDI für Patterns, Soundbank-Manifest + Blobs, WAV-Export mit Metadaten.
- **Fehlende Komponenten:** StepGrid/StepCell sind nur als Markdown-Doku vorhanden, nicht im Build.
- **Panels:** Viele Panels existieren im Code, sind aber nicht immer im UI gemountet (siehe `pages/index.vue`).
- **Focus/Accessibility:** PadGrid/PadCell benötigen explizite Refs für Fokussteuerung.

## Beispiele & Referenzen
- **Audio-Engine:** `audio/engine/`, `audio/fxGraph.ts`, `audio/stepResolver.ts`
- **Stores:** `stores/`
- **Composables:** `composables/`
- **Panels:** `components/panels/`
- **Export:** `useImportExport`, `exportAudio`, ExportPanel
- **Diagrams:** `diagrams/`

## Hinweise für KI-Agenten
- Halte dich an die bestehenden Patterns und Strukturen.
- Prüfe, ob Komponenten im UI gemountet sind, bevor du UI-Änderungen vorschlägst.
- Beachte deterministische Exporte (Seed, Metadaten) und die zentrale Rolle von AudioContext.
- Dokumentiere neue Patterns/Workflows in der README oder als Kommentar im Code.
