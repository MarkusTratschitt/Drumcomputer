# Drumcomputer

Nuxt 4 drum machine using Vue 3 Options API + TypeScript strict, Vuetify 3 (Pug + Less), Web Audio lookahead scheduling, Web MIDI capability checks, and IndexedDB stubs for soundbanks.

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

## Features

- Lookahead Web Audio scheduler with AudioContext time, quantized live recording, and 16-pad grid sequencing.
- Default kit served from `public/samples` and auto-loaded into the audio engine; patterns persist via LocalStorage (v1 schema with normalization).
- Pinia stores for transport, patterns/scenes, session caps, and soundbanks; composables for audio, scheduler, sequencer, MIDI, sync, import/export, audio input, and IndexedDB soundbank storage (banks, samples, patterns).
- Client-only MIDI hooks with device selection, pad mapping, and MIDI clock support (master/slave) plus Ableton Link stub exposure via sync panel.
- Soundbank manager can select banks and replace pad samples (stored as blobs in IndexedDB) with lazy decoding; patterns also persisted per-bank in IDB.
- Configurable step grid divisions (1/2/4/8/16/32/64) with responsive layout for larger sequences and stable transport start/stop handling.
- Import/Export helpers for patterns, MIDI (@tonejs/midi), soundbank manifests + sample blobs, and WAV bounce via OfflineAudioContext.
- Scene chains with bar-boundary pattern switching, per-step velocity/accent cycling, and an FX chain (filter/drive/reverb) routed through the WebAudio graph.

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

## Deterministic FX & Export

- The FX chain now derives from a serializable `FxSettings` snapshot and only applies filter/drive/reverb updates via `setValueAtTime`, making the graph stable for live and rendered sessions alike.
- The convolution impulse uses the new seeded RNG helper, and the audio engine exposes `getFxSnapshot`/`setFxRandomSource` so exports can rebuild identical FX + randomness when supplied with the same seed.
- The offline WAV export now runs through the same `RenderClock` + `scheduleStep` loop as live playback, rebuilds the FX graph from the current `FxSnapshot`, and seeds the impulse response via `createSeededRandom`. `exportAudio` returns a `RenderMetadata` payload (seed, bpm, grid spec, scene/pattern chain, duration) and—when `import.meta.env.DEV`—an optional debug timeline so the UI can attach a JSON blob alongside the WAV.
- To reproduce a bounce, pass the recorded `seed` back into `exportAudio` (or rehydrate the FX snapshot that produced it) so the same impulse response + scheduling is rebuilt; the metadata blob makes pairing the WAV with its deterministic context easy for debugging or downstream tooling.

### Export metadata UI
The Export audio card sits under the soundbank/Fx controls and invokes `exportAudio` for the current scene chain. Once the bounce finishes, the metadata panel appears below the export button and exposes the seed, BPM, grid spec, scene/pattern chain, event count, and rendered duration. Use the panel buttons to download the WAV/JSON, inspect the dev timeline (visible only in `process.dev`), or copy the seed for later replays.

### Reproducing exports with the seed
Copy the exported seed from the metadata panel (or the JSON blob) and supply it to `exportAudio(renderDuration, sampleRate, { seed: Number(seedValue) })` together with the scene's FX snapshot/grid spec, and the offline render will replay the exact same randomness, FX response, and scheduling that produced the mixdown.

## Roadmap

- FX chain (filter/drive), pattern scenes, and extended sample browser with drag/drop.
