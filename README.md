# Drumcomputer

Nuxt 4 Drumcomputer blueprint with strict TypeScript, Vuetify (Pug + Less), Web Audio scheduling, and Web MIDI/IDB hooks.

## Setup

```bash
npm install
npm run dev
```

## Browser limitations

- Web MIDI API requires HTTPS and user permission; capability checks gate the UI.
- Audio input relies on `getUserMedia` and may prompt for microphone access.
- Output device selection is limited to the default output in most browsers.

## Roadmap

- Native/bridge-backed Ableton Link provider for desktop or mobile shells.
- AudioWorklet-based recording path to replace MediaRecorder/ScriptProcessor fallbacks.
- FX chain, pattern scenes, and advanced export flows (stems, MIDI files).
