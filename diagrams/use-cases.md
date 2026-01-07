# Sequence Diagrams for the documented Use Cases

## Live pattern building
```mermaid
sequenceDiagram
  participant User
  participant PadGrid
  participant DrumMachine
  participant Sequencer
  participant PatternsStore
  participant TransportStore

  User->>PadGrid: tap pad (velocity)
  PadGrid->>DrumMachine: pad:down(padId, velocity)
  DrumMachine->>Sequencer: recordHit(padId, velocity, quantized=true)
  Sequencer->>PatternsStore: toggleStep/current pattern
  DrumMachine->>TransportStore: ensure transport running/looping
  DrumMachine-->>User: updated pad state + playhead feedback
```

## Scene and pattern chaining
```mermaid
sequenceDiagram
  participant User
  participant PatternsPanel
  participant DrumMachine
  participant PatternsStore
  participant Sequencer
  participant TransportStore

  User->>PatternsPanel: set scene pattern chain
  PatternsPanel->>DrumMachine: scene:update(patternIds)
  DrumMachine->>PatternsStore: updateScene(...)
  User->>TransportStore: start transport
  TransportStore-->>DrumMachine: isPlaying=true
  DrumMachine->>Sequencer: start()
  Sequencer->>PatternsStore: prepareScenePlayback()
  Sequencer-->>PatternsStore: advanceScenePlayback() at bar boundary
```

## Soundbank customization and persistence
```mermaid
sequenceDiagram
  participant User
  participant SoundPanel
  participant DrumMachine
  participant SoundbanksStore
  participant SoundbankStorage
  participant Sequencer

  User->>SoundPanel: upload sample for pad
  SoundPanel->>DrumMachine: replacePadSample(padId, file)
  DrumMachine->>SoundbanksStore: upsertBank(updatedBank)
  DrumMachine->>SoundbankStorage: saveBank/saveSample
  DrumMachine->>Sequencer: setSampleForPad/applySoundbank
  DrumMachine-->>User: updated pad label + sound
```

## MIDI/hardware integration
```mermaid
sequenceDiagram
  participant User
  participant TransportBar
  participant DrumMachine
  participant Midi
  participant MidiLearn
  participant Sequencer
  participant TransportStore

  User->>TransportBar: toggle MIDI learn
  TransportBar->>DrumMachine: toggleMidiLearn()
  MidiLearn-->>User: awaiting pad/transport mapping
  Midi-->>MidiLearn: noteOn(message)
  MidiLearn->>Midi: setPadForNote / set transport mapping
  User->>TransportStore: start via mapped note
  TransportStore-->>DrumMachine: isPlaying=true
  DrumMachine->>Sequencer: start()
  Midi->>ExternalClock: send/start/stop (if master)
```

## Export mixes and stems
```mermaid
sequenceDiagram
  participant User
  participant ExportPanel
  participant DrumMachine
  participant ImportExport
  participant Sequencer

  User->>ExportPanel: click Export mixdown
  ExportPanel->>DrumMachine: export()
  DrumMachine->>ImportExport: exportAudio(duration)
  ImportExport->>Sequencer: render scene chain via RenderClock
  ImportExport-->>DrumMachine: {audioBlob, metadata, stems}
  DrumMachine-->>ExportPanel: metadata + download actions
  User->>ExportPanel: download WAV/ZIP/stems
```

## Import and normalization
```mermaid
sequenceDiagram
  participant User
  participant ImportUI
  participant DrumMachine
  participant ImportExport
  participant PatternsStore
  participant SoundbanksStore

  User->>ImportUI: select pattern JSON / MIDI / soundbank bundle
  ImportUI->>DrumMachine: import request
  DrumMachine->>ImportExport: parse/normalize payload
  ImportExport->>PatternsStore: setPatterns / updateGridSpec normalized
  ImportExport->>SoundbanksStore: upsertBank + samples
  DrumMachine-->>User: normalized patterns/soundbanks ready to play
```

## MK3 hardware-style navigation & hover hints
```mermaid
sequenceDiagram
  participant User
  participant Displays as DualDisplays+SoftButtons
  participant ScreenKnobs
  participant Encoder as 4DEncoder
  participant Transport as TransportCluster
  participant Modes as ModeColumn
  participant Pads

  User->>Displays: hover soft button (see hint + symbol)
  User->>ScreenKnobs: hover knob (opens selector overlay with values)
  ScreenKnobs->>Encoder: nudge/confirm selection
  Modes-->>Pads: change pad mode (mute/solo/select)
  Transport-->>Pads: play/stop/rec/restart toggles
  User->>Pads: tap pad (see pad label + hover legend)
  Displays-->>User: status update (no page scroll)
```

- Keep all interactions inside the hardware viewport; drawers and selector overlays scroll internally while the page remains locked.
- Hover hints should list both primary and shift-layer actions to mirror the MK3 printed labels.

## Browser diagrams

- 4D encoder wiring: `control-4d-encoder-browser.md`
- File system access: `browser-file-system-access.md`
- Import progress: `library-import-progress.md`
- Recent files: `recent-files.md`
- Favorites: `favorites-flow.md`
- Sample preview: `sample-preview.md`
- Sorting: `browser-sorting.md`
- Quick-browse: `quick-browse.md`
- Tag dialog: `tag-dialog.md`
- Hierarchy: `library-hierarchy.md`
- Performance: `browser-performance.md`
