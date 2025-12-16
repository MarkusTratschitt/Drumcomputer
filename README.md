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

## Features

- Lookahead Web Audio scheduler with AudioContext time, quantized live recording, and 16-pad grid sequencing.
- Default kit served from `public/samples` and auto-loaded into the audio engine; patterns persist via LocalStorage.
- Pinia stores for transport, patterns/scenes, session caps, and soundbanks; composables for audio, scheduler, sequencer, MIDI, sync, import/export, audio input, and IDB soundbank storage.
- Client-only MIDI hooks with capability checks; sync panel stub for internal/midi/link modes; soundbank manager + sample browser stubs for future extensions.

## Browser support / limitations

- Web MIDI only over HTTPS/localhost after user permission; device lists stay empty when unsupported.
- Audio input uses `getUserMedia`; user denial disables monitoring/capture.
- AudioContext needs a user gesture before it can play in some browsers; first pad tap will resume the context.
- Background throttling can delay scheduled steps despite lookahead; keep tab focused for tight timing.

## Roadmap

- IndexedDB-backed soundbank persistence with blobbed samples and import/export.
- MIDI clock master/slave sync, per-pad note mapping UI, and Ableton Link provider bridge.
- Audio input capture to pad samples and WAV/SMF export via OfflineAudioContext + @tonejs/midi.
- FX chain (filter/drive), pattern scenes, and extended sample browser with drag/drop.
