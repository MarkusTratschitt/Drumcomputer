# Drumcomputer

Nuxt 4 drum machine using Vue 3 Options API + TypeScript strict, Vuetify 3 (Pug + Less), Web Audio lookahead scheduling, Web MIDI capability checks, and IndexedDB stubs for soundbanks.

![UI screenshot](assets/screenshots/screenshot.png)

## Maschine MK3 UI Parity Plan (2026-01-04)

- **No-scroll full-screen shell**: Lock the hardware wrapper to `100vh` with inner flex grids only; push any overflow (sound/FX/pattern drawers) into internal scroll areas and clamp paddings/margins so a 1080p viewport fits without page scroll.
- **Layout map (placeholders first)**: Dual displays with 8 soft buttons on top, 8 screen knobs below, 4D encoder + master/volume knob cluster and nav buttons between displays, transport cluster bottom-left, left column for mode buttons (Scene/Pattern/Events/Variation/Duplicate/Select/Mute/Solo) plus Shift, right column for touch strip + pad mode buttons (Keyboard/Chord/Step/Note Repeat), 4×4 pads on the right, performance LEDs, and a small meter/pad bank indicator row.
- **Button symbols + hover hints**: Use consistent symbols and `title`/tooltip hints on every control. Proposed symbols: Play ▶, Stop ■, Rec ●, Restart ↻, Loop ⟳, Count-In ♩, Tap Tempo ☼, Metronome ♬, Follow ⇥, Pad Bank ◪, Duplicate ⧉, Select ☐, Mute 🔇, Solo ⚡, Scene ▤, Pattern ▦, Events ✱, Variation ≈, Keyboard ⌨, Chords ♫, Step ◫, Note Repeat ✺, Shift ⇧, 4D encoder arrows ↕↔, Touch Strip ≡.
- **Placeholder components to scaffold**: `DualDisplayPlaceholder` (dual LCD mock with soft-label text), `SoftButtonStripPlaceholder`, `ScreenKnobRingPlaceholder` (shows detents + hover hint), `FourDEncoderPlaceholder`, `TransportClusterPlaceholder`, `ModeColumnPlaceholder`, `TouchStripPlaceholder`, `PadBankIndicator`, `PerformanceMeterPlaceholder`, `OverlayHint` (hover helper for any element), and `DrawerPanelFrame` with fixed height for scroll containment.
- **Interaction & hover behavior**: Every element should expose a hover hint describing primary + shift-layer functions; knobs/buttons trigger placeholder overlays that can later be wired to real handlers. Touching/hovering a screen knob opens a selector overlay mock; encoder hover shows navigation arrows + confirm hint; transport buttons expose play/stop/reset semantics.
- **Sizing refactor plan**: Reduce outer gutters, use CSS `clamp()` for hardware widths/heights, pin pad square to max 640px with responsive shrink, align display + knob rows to match MK3 proportions, and keep drawers at a fixed height (e.g., 360px) with internal scroll so the main stage never scrolls.

## Setup

```bash
npm install
npm run dev
# QA
npm run lint
npm run typecheck
```

To override the dev or HMR port, prefix the command with the env vars you need:
```bash
PORT=3001 HMR_PORT=24679 npm run dev
```

## Use Cases

- Build and rehearse drum patterns live: tap pads, quantized record hits, and loop transport with velocity cycling and pad focus for performance.
- Arrange song ideas with scenes and pattern chains: switch patterns at bar boundaries and normalize grid specs when divisions change.
- Customize soundbanks: swap pad samples from local files, persist banks/patterns in IndexedDB/LocalStorage, and rehydrate blobs on load.
- Connect hardware: map pads and transport to MIDI notes, follow or drive MIDI clock, and probe WebMIDI/Audio input capabilities in the UI.
- Export mixes or stems: bounce the current scene chain to WAV/ZIP with deterministic FX seeds and optional per-pad stems for downstream DAWs.
- Normalize/import assets: round-trip patterns via JSON/MIDI, import/export soundbank manifests + blobs, and clamp malformed payloads.

## Features

- Lookahead Web Audio scheduler with AudioContext time, quantized live recording, and 16-pad grid sequencing.
- Default kit served from `public/samples` and auto-loaded into the audio engine; patterns persist via LocalStorage (v1 schema with normalization).
- Pinia stores for transport, patterns/scenes, session caps, and soundbanks; composables for audio, scheduler, sequencer, MIDI, sync, import/export, audio input, and IndexedDB soundbank storage (banks, samples, patterns).
- Client-only MIDI hooks with device selection, pad mapping, and MIDI clock support (master/slave) plus Ableton Link stub exposure via sync panel.
- Soundbank manager can select banks and replace pad samples (stored as blobs in IndexedDB) with lazy decoding; patterns also persisted per-bank in IDB.
- Configurable step grid divisions (1/2/4/8/16/32/64) with responsive layout for larger sequences and stable transport start/stop handling.
- Import/Export helpers for patterns, MIDI (@tonejs/midi), soundbank manifests + sample blobs, and WAV bounce via OfflineAudioContext.
- Scene chains with bar-boundary pattern switching, per-step velocity/accent cycling, and an FX chain (filter/drive/reverb) routed through the WebAudio graph.

## Integrated Browser

- Local file access via the File System Access API (with a safe memory fallback when unsupported or denied).
- Hierarchical filters (Category → Product → Bank → SubBank), favorites, recents, and quick-browse restore.
- 4D encoder integration for field navigation, filter edits, and tag management without new UI controls.
- Preview (prehear) playback for selected items using the shared AudioContext.
- Sort modes, import progress tracking, and list virtualization for large libraries.

## Control Area (MK3)

- Pinia store `stores/control.ts` owns modes, per-mode pages, soft buttons, encoder parameters, and display models; DrumMachine wires it without changing layout.
- Mode buttons fire primary and SHIFT secondary actions (e.g., CHANNEL→MIDI, PLUGIN→Instance, BROWSER→Plug-in menu, FILE→Save As, MACRO→Set). Page ◀/▶ steps through pages within the active mode.
- SoftButtonStrip renders 8 dynamic labels/tooltips per page and emits press events; display soft labels mirror the current soft buttons.
- DualDisplay renders contextual panels for Browser, File, Settings, Sampling, Mixer, Arranger, and info views; header shows mode + page.
- Encoders react to mousewheel on hover and arrow keys; SHIFT enables fine step. SHIFT hold is de-latched via global pointer/key listeners; knobs expose tabindex + aria-label.

## Analysis & Plan

- **Current gaps**: Pattern/scene editing UIs are not mounted on `pages/index.vue`; transport lacks full MK3 semantics; placeholder overlays for soft buttons/encoders/4D are not wired; accessibility coverage is partial.
- **To close parity**: Restore sequencer UI (StepGrid/StepCell) and mount Patterns/Export/TabPanel; bring transport to MK3 semantics (play/stop toggle, stop-reset, restart, count-in, tap tempo, follow/metronome controls, loop range adjust); add grid/loop UX and erase panels; surface channel/plug-in/macro/midi control modes with soft labels; wire selector overlays to 4D/soft buttons; ensure a11y labels and focus flows.

## Timing & Sync

- AudioContext is the sole clock authority; the lookahead scheduler, sequencer, and MIDI clock master all derive their timings from `AudioContext.currentTime`.
- A small `RenderClock` wrapper now feeds every scheduler/step planner from the shared `scheduleStep` helper so live playback and future offline renders can work off the same time basis.
- MIDI clock output follows the audio clock (scheduled via the lookahead worker); incoming MIDI clock only drives phase counters/start-stop follow and never retimes audio events.
- BPM updates are clamped and restored on sync mode/role changes to prevent drift when switching between internal and MIDI clock roles; transport BPM remains the master source.

## Workflow & UX

- Undo/redo history for pattern + scene edits (50 steps), persisted alongside scenes/pattern selection.
- Capability gates surface WebMIDI/Audio In support status directly in the UI.
- Importers normalize grid specs/velocities and soundbank manifests to handle malformed payloads more gracefully.

## Layout Notes

- Viewport locked, drawer scrolls internally.

## Browser support / limitations

- Web MIDI only over HTTPS/localhost after user permission; device lists stay empty when unsupported.
- Audio input uses `getUserMedia`; user denial disables monitoring/capture.
- AudioContext needs a user gesture before it can play in some browsers; first pad tap will resume the context.
- Background throttling can delay scheduled steps despite lookahead; keep tab focused for tight timing.

## BFCache Compatibility

- Web Audio: AudioContext is suspended on `pagehide` and resumed on `pageshow` to avoid active audio blocking BFCache restores.
- Media Input: Microphone streams and their AudioContext are stopped/closed on `pagehide`.
- MIDI: Device listeners detach on `pagehide` and reattach/refresh on `pageshow` when access is available.
- Scheduling: Lookahead intervals for sequencer/sync pause on `pagehide` and restart on `pageshow` when they were running.

## Deterministic FX & Export

- The FX chain now derives from a serializable `FxSettings` snapshot and only applies filter/drive/reverb updates via `setValueAtTime`, making the graph stable for live and rendered sessions alike.
- The convolution impulse uses the new seeded RNG helper, and the audio engine exposes `getFxSnapshot`/`setFxRandomSource` so exports can rebuild identical FX + randomness when supplied with the same seed.
- The offline WAV export now runs through the same `RenderClock` + `scheduleStep` loop as live playback, rebuilds the FX graph from the current `FxSnapshot`, and seeds the impulse response via `createSeededRandom`. `exportAudio` returns a `RenderMetadata` payload (seed, bpm, grid spec, scene/pattern chain, duration) and—when `import.meta.env.DEV`—an optional debug timeline so the UI can attach a JSON blob alongside the WAV.
- To reproduce a bounce, pass the recorded `seed` back into `exportAudio` (or rehydrate the FX snapshot that produced it) so the same impulse response + scheduling is rebuilt; the metadata blob makes pairing the WAV with its deterministic context easy for debugging or downstream tooling.

### Export metadata UI
The Export audio card sits under the soundbank/Fx controls and invokes `exportAudio` for the current scene chain. Once the bounce finishes, the metadata panel appears below the export button and exposes the seed, BPM, grid spec, scene/pattern chain, event count, and rendered duration. Use the panel buttons to download the WAV/JSON, inspect the dev timeline (visible only in `process.dev`), or copy the seed for later replays.

### Reproducing exports with the seed
Copy the exported seed from the metadata panel (or the JSON blob) and supply it to `exportAudio(renderDuration, sampleRate, { seed: Number(seedValue) })` together with the scene's FX snapshot/grid spec, and the offline render will replay the exact same randomness, FX response, and scheduling that produced the mixdown.

## Recent Fixes / Stability & Diagrams

- PadGrid: Removed stray `button.pad-cell`; focus restore now uses stable PadCell refs to avoid runtime errors.
- TransportEngine: Scheduler is cleared/reseeded on config changes; step boundaries use absolute steps with wrap guards so tempo/division changes do not produce double/missed triggers.
- Docs: Mermaid diagrams fixed (valid IDs/arrows, GitHub-compatible).

## Feature Branch Changes (fix/padgrid-transport-scheduler-and-diagrams)

- Slot-based DrumMachine hardware with separate slots for transport, pads, and drawer; index layout slimmed down to `v-app` + slots.
- PadGrid refactor: per-cell pad refs, new keyboard navigation, and key labels introduced (currently not rendered).
- Drawer/panel stack re-ordered (Sound/FX/Patterns/Export), TransportBar styled with BPM/Division/Loop controls, global color/spacing variables and Nuxt global styles added.
- MIDI layer streamlined: mapping/learn persisted, simpler MIDI status access, layout metadata cleaned up.
- Sequencer components (`StepGrid.vue`, `StepCell.vue`) removed from the build; only Markdown stubs remain, so the UI currently renders pads/transport/FX only.

## Diagrams

- Transport timing: `diagrams/transport-engine.md`
- UI sequencer flow: `diagrams/ui-sequencer.md`
- Persistence + audio pipeline: `diagrams/persistence-and-audio.md`
- Control area mapping: `diagrams/control-area-mapping.md`
- Browser 4D encoder wiring: `diagrams/control-4d-encoder-browser.md`
- Browser file system access: `diagrams/browser-file-system-access.md`
- Browser import progress: `diagrams/library-import-progress.md`
- Browser recent files: `diagrams/recent-files.md`
- Browser favorites: `diagrams/favorites-flow.md`
- Browser sample preview: `diagrams/sample-preview.md`
- Browser sorting: `diagrams/browser-sorting.md`
- Browser quick-browse: `diagrams/quick-browse.md`
- Browser tag dialog: `diagrams/tag-dialog.md`
- Browser hierarchy: `diagrams/library-hierarchy.md`
- Browser performance: `diagrams/browser-performance.md`

## Current UI / Editing State

- 16-pad surface shows three states (selected, currently triggered at the playhead, or playing anywhere in the pattern) and derives pad labels from the active soundbank.
- Step toggles cycle velocity levels 0.7 → 1.0 → 1.25 → off; accents (>=1.25) are tinted in the grid, and the playhead overlay tracks the normalized step even when looping.
- Patterns + scenes are stored in LocalStorage (v2 schema with selected/active ids) and a 50-step undo/redo history guards edits; scene playback always prepares the first scene pattern before transport start or external sync start.
- Scene chains advance at pattern boundaries and honor normalized grid specs when divisions change, so transport + sequencer stay aligned.

## Soundbanks & Persistence

- A default kit seeds four kicks/snares/hihats/claps across 16 pads; if no banks exist on load the bank is saved to IndexedDB and selected automatically.
- Soundbanks, samples (blobs), and per-bank pattern copies are persisted to IndexedDB (v2 database with soundbanks/samples/patterns stores); samples are rehydrated from blobs on load.
- Replacing a pad sample infers the format from the filename, revokes old blob URLs, updates the sequencer in place, and writes both the bank metadata and the blob to IDB.
- Soundbank import/export supports manifest JSON + sample files; pad assignments are hydrated against the manifest ids so banks can round-trip with external files.

## Import/Export Surface

- Pattern JSON import/export + MIDI import/export (tonejs/midi) are wired through `useImportExport`; MIDI uses the current mapping and pulls velocity into step velocities.
- Offline export now optionally renders per-pad stems (only for pads that have a sample in the current cache) alongside the mixdown; stem file names are slugged from the scene/bank name.
- `exportAudio` auto-downloads the mixdown WAV, returns metadata + optional debug timeline, and the Export panel exposes buttons for WAV, ZIP bundle (mixdown + render-meta + stems), or individual/all stems.
- Export duration is derived from the active scene's pattern chain (bars × division) so renders match the current arrangement at the time you press Export.

## Workflows

The application supports several key user workflows:

### 1. Live Pattern Building
- **Goal**: Create and rehearse drum patterns in real-time
- **Steps**: 
  1. Select a pad (via mouse click, touch, or keyboard shortcuts 1-V)
  2. Tap pads to trigger sounds manually
  3. Enable recording (Ctrl+R) to capture hits quantized to the grid
  4. Start transport (Space) with loop enabled (L) to rehearse patterns
  5. Adjust velocity levels by clicking steps multiple times (0.7 → 1.0 → 1.25 → off)
- **Diagram**: See `diagrams/use-cases.md` (Live pattern building)

### 2. Scene and Pattern Chaining
- **Goal**: Arrange song ideas by switching patterns at bar boundaries
- **Steps**:
  1. Create multiple patterns with different drum parts
  2. Create a scene and add patterns to the chain
  3. Start transport to play through the scene
  4. Patterns advance automatically at bar boundaries
  5. Grid specs normalize when divisions change
- **Diagram**: See `diagrams/use-cases.md` (Scene and pattern chaining)

### 3. Soundbank Customization
- **Goal**: Build custom drum kits with your own samples
- **Steps**:
  1. Select a pad
  2. Open browser (B or Ctrl+B)
  3. Navigate to your samples (FILES mode: Shift+B)
  4. Preview samples (Shift+P)
  5. Load to selected pad (Ctrl+Enter)
  6. Samples are persisted to IndexedDB and rehydrated on load
- **Diagram**: See `diagrams/use-cases.md` (Soundbank customization and persistence)

### 4. MIDI Hardware Integration
- **Goal**: Map hardware controllers to pads and transport
- **Steps**:
  1. Connect MIDI device (requires HTTPS/localhost)
  2. Enable MIDI learn mode
  3. Trigger pads or transport controls from hardware
  4. Mappings are saved and persist across sessions
  5. Configure MIDI clock sync (master/slave modes)
  6. MIDI clock output follows AudioContext timing
- **Diagram**: See `diagrams/use-cases.md` (MIDI/hardware integration)

### 5. Export and Stems
- **Goal**: Bounce scenes to WAV files with optional per-pad stems
- **Steps**:
  1. Configure your scene chain and FX settings
  2. Click Export in the Export panel
  3. Offline render runs with deterministic FX and seeded RNG
  4. Download mixdown WAV, metadata JSON, or ZIP bundle
  5. Optional: Export individual per-pad stems for DAW mixing
  6. Seed value in metadata allows reproducible renders
- **Diagram**: See `diagrams/use-cases.md` (Export mixes and stems)

### 6. Browser Search and Quick-Browse
- **Goal**: Quickly find and load samples from large libraries
- **Steps**:
  1. Open browser (B)
  2. Focus search field (Ctrl+K)
  3. Type search query with filters (category, product, bank, tags)
  4. Navigate results with arrow keys or 4D encoder
  5. Preview samples (Shift+P)
  6. Load to pad (Ctrl+Enter)
  7. Quick-browse restores last search context per pad
- **Diagrams**: See `diagrams/quick-browse.md`, `diagrams/browser-sorting.md`, `diagrams/control-4d-encoder-browser.md`

### 7. Pattern Import/Export and MIDI Round-Trip
- **Goal**: Share patterns or integrate with DAWs
- **Steps**:
  1. Export pattern to JSON (preserves velocity, grid spec, soundbank refs)
  2. Export pattern to MIDI file via @tonejs/midi
  3. Import MIDI files back with velocity mapping
  4. Soundbank manifests export with sample blobs for portability
  5. Grid specs normalize on import to handle malformed data
- **Diagram**: See `diagrams/use-cases.md` (Import and normalization)

## Shortcuts

All keyboard shortcuts are registered globally and shown in tooltips. Shortcuts use the command pattern with conflict detection.

### Transport Controls
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | Play | Start/resume transport playback |
| `Shift+Space` | Stop | Stop transport (with stop-reset on second press) |
| `Ctrl+R` | Record | Toggle live recording mode |
| `T` | Tap Tempo | Tap to set BPM |
| `M` | Metronome | Toggle metronome click |
| `C` | Count-In | Toggle count-in bars before recording |
| `L` | Loop | Toggle loop mode |
| `F` | Follow | Toggle MIDI clock follow mode |

### Browser Controls
| Shortcut | Action | Description |
|----------|--------|-------------|
| `B` | Toggle Browser | Open/close browser panel |
| `Ctrl+B` | Browser Mode | Switch to browser mode |
| `Escape` | Close Browser | Close browser panel |
| `Ctrl+K` | Search Focus | Focus browser search field |
| `Ctrl+Backspace` | Clear Search | Clear search query |
| `Shift+P` | Preview Toggle | Play/stop sample preview |
| `Ctrl+Enter` | Load to Pad | Import selected sample to current pad |
| `Enter` | Navigate Into | Enter selected folder/item |
| `Backspace` | Navigate Back | Go up one folder level |
| `ArrowUp` | Navigate Up | Move selection up in list |
| `ArrowDown` | Navigate Down | Move selection down in list |
| `Shift+L` | Library Mode | Switch browser to LIBRARY mode |
| `Shift+B` | Files Mode | Switch browser to FILES mode |

### Pad Selection (Grid Layout)
| Shortcut | Pad | Shortcut | Pad | Shortcut | Pad | Shortcut | Pad |
|----------|-----|----------|-----|----------|-----|----------|-----|
| `1` | Pad 1 | `2` | Pad 2 | `3` | Pad 3 | `4` | Pad 4 |
| `Q` | Pad 5 | `W` | Pad 6 | `E` | Pad 7 | `R` | Pad 8 |
| `A` | Pad 9 | `S` | Pad 10 | `D` | Pad 11 | `F` | Pad 12 |
| `Z` | Pad 13 | `X` | Pad 14 | `C` | Pad 15 | `V` | Pad 16 |

**Note**: Pad grid also supports arrow key navigation when focused, plus `Home`, `End`, `PageUp`, `PageDown`.

### Pattern and Scene Management
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+N` | New Pattern | Create a new pattern |
| `Ctrl+D` | Duplicate Pattern | Duplicate current pattern |
| `Ctrl+Delete` | Clear Pattern | Clear all steps in current pattern |
| `Ctrl+Shift+N` | New Scene | Create a new scene |
| `Ctrl+Space` | Scene Play | Play selected scene |
| `Ctrl+Shift+Space` | Scene Stop | Stop scene playback |

### Undo/Redo
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Z` | Undo | Undo last pattern/scene edit |
| `Ctrl+Shift+Z` | Redo | Redo last undone edit |

### 4D Encoder and Knobs
| Shortcut | Action | Description |
|----------|--------|-------------|
| `ArrowUp` | Knob Increment | Increase focused knob value |
| `ArrowDown` | Knob Decrement | Decrease focused knob value |
| `Shift+ArrowUp` | Fine Increment | Increase focused knob value (fine) |
| `Shift+ArrowDown` | Fine Decrement | Decrease focused knob value (fine) |
| `PageUp` | 4D Turn Up | Turn 4D encoder up |
| `PageDown` | 4D Turn Down | Turn 4D encoder down |
| `ArrowLeft` | 4D Tilt Left | Tilt 4D encoder left |
| `ArrowRight` | 4D Tilt Right | Tilt 4D encoder right |
| `Enter` | 4D Press | Confirm 4D encoder selection |

### Mode Buttons
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+1` | Channel Mode | Switch to channel mode |
| `Ctrl+2` | Plugin Mode | Switch to plugin mode |
| `Ctrl+3` | Arranger Mode | Switch to arranger mode |
| `Ctrl+4` | Mixer Mode | Switch to mixer mode |
| `Ctrl+5` | Sampling Mode | Switch to sampling mode |

### Quick Edit
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Alt+V` | Quick Volume | Open quick volume editor |
| `Ctrl+Alt+S` | Quick Swing | Open quick swing editor |
| `Ctrl+Alt+T` | Quick Tempo | Open quick tempo editor |

**Shortcut Documentation**: See `SHORTCUT_AUDIT_REPORT.md` for implementation details and coverage metrics (64.2% registered, all mounted UI controls covered).

**Shortcut Diagram**: See `diagrams/shortcuts-overview.md` for visual reference.

## Roadmap

- Stabilize transport scheduling: normalize queued step indices across loops, clear/reseed scheduler queues on config changes, and extend tests for swing + lookahead edge cases.
- Fix PadGrid focus/activation: remove the stray root button or wire it correctly, attach `ref`s to `PadCell` for focus restoration, and add keyboard-focus tests.
- Expand automated coverage: integrate component tests for `PadGrid`/`StepGrid` interactions and regression tests around transport start/stop/reconfigure flows.
- UX polish: expose scheduler/debug timelines in dev mode, improve empty-state messaging for pads without a selected bank/pad, and add ARIA labels around sequencing controls.
- Stretch: FX chain enhancements (filter/drive) and an extended sample browser with drag/drop and manifest previews.

## Code Review Findings (2026-01-04)

- `pages/index.vue`: Main slot renders a blank placeholder and mounts only transport/pads/FX; there is no scaffold for displays, soft buttons, encoder, mode clusters, touch strip, or hover hints, so MK3 parity cannot be reached without adding new slots/components.
- `components/DrumMachine.vue`: The hardware shell is fixed to a two-column transport+drawer vs. pads layout with clamped widths; adding the MK3 top displays, left/right button columns, and touch strip would currently overflow and reintroduce page scroll. Needs a size refactor and new placeholder regions.
- `components/TransportBar.vue`: Transport buttons rely solely on icons, have no hover hints/tooltips, and miss MK3 semantics (play/stop toggle, stop-reset, shift+rec count-in, restart). The dense vertical stack will not fit once displays/soft buttons are added.
- `components/PadGrid.vue`: Pads expose neither tooltips nor pad labels/LED hints in the UI. `is-empty` derives from missing pad state rather than sample presence, so freshly loaded banks render as “empty” even when defaults exist.
- `components/PadGrid.vue`: KEY_LABELS are hard-coded to 16 entries; any future pad bank paging or alternate pad counts will desync labels and navigation unless the labels derive from the pads prop.

## Hardware Layout & UI Reference

### PadGrid (4×4)
- 16 pads in a 4×4 grid (pad1–pad16) with distinct states for selected, triggered (current step), and playing. Each PadCell is a native button.
- Accessibility: `aria-label` per pad, `aria-rowcount`/`aria-colcount`/`aria-rowindex`/`aria-colindex`, and `tabindex` in pad order; focus refs support keyboard focus moves. The pattern indicator sits next to the grid.

### Mode Buttons (left of PadGrid)
- Vertical stack of 8 mode buttons; sized to align with pad heights and the Softbutton 4 reference line above Display 1. Buttons expose `aria-label`/`title` and keyboard focus.

### Fixed Velocity + Pad Mode (top row)
- Fixed Velocity plus PAD MODE/KEYBOARD/CHORD/STEP row aligned to the Softbutton row above Display 2 as the horizontal reference.

### Softbutton references
- Softbutton 4 above Display 1 defines the vertical alignment line for the mode column. The softbutton row above Display 2 defines the horizontal reference for Fixed Velocity and Pad Mode buttons (see `diagrams/padgrid-modus-layout.md`).

### Accessibility
- PadGrid: ARIA grid metadata, labels, and focusable buttons.
- Mode/Pad-Mode/Fixed-Velocity buttons: native button semantics with labels/titles and consistent tab order.
- Softbuttons remain labeled reference points for screen readers to understand spatial layout.

### TransportBar
- Standalone transport/pattern/step control component. Props include `bpm`, `division`/`divisions`, `loop`, `patternBars`, `presetBars`/`presetDivision`, `selectedPad`, and flags (`isPlaying`, `isRecording`, `countInEnabled`, `metronomeEnabled`, `followEnabled`, `liveEraseEnabled`).
- Events cover transport (play/stop/stop-reset/restart), tempo (`update-bpm`, `increment-bpm`, `decrement-bpm`, `tap-tempo`), grid (`update-division`, `update-pattern-bars`, `update:preset-*`), loop (`update-loop`, `nudge-loop-range`, `update-loop-start`, `update-loop-end`), metronome/follow (`toggle-metronome`, `update:metronome-volume`, `toggle-follow`), count-in (`toggle-count-in`, `update-count-in-bars`), MIDI learn, and live erase (`toggle-live-erase`, `erase-pad`, `erase-current-step`). Buttons use native semantics plus `aria-label`/`title` for a11y/tooltips.

### Diagram
- Layout visualization with reference lines for dual displays, softbutton rows, mode column, Fixed Velocity/Pad Mode row, and PadGrid: see `diagrams/padgrid-modus-layout.md`.
