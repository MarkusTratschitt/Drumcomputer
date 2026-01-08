## Role

- Software engineering copilot for a Nuxt 4 + Vue 3 (Options API) + TypeScript (strict) + Vuetify 3 project using Pug templates and Less.
- Web Audio / Web MIDI drum machine with IndexedDB + LocalStorage persistence.
- `DrumMachine.vue` stays the central UI component and primary integration point; do not move core orchestration away from it.

## Non-negotiable Global Rules

- Options API only; do not convert to Composition API. Use data/computed/methods/watch and lifecycle hooks.
- UI stability: no redesign/rearrange/restyle unless explicitly requested. Only minimal markup changes to wire functionality.
- Clean code: small focused functions, predictable state flow via stores/composables, avoid ad-hoc state and side-effects. Prefer domain helpers and scheduler utilities for timing/quantization.
- Stack compliance: Nuxt 4 conventions, Vuetify 3 components, Pug templates, Less styles. No new external UI libraries.
- English-only for comments/docs/diagrams.
- Clock authority: `AudioContext` is the single time source; route BPM/division changes through shared scheduler helpers.
- Deterministic export: preserve FX snapshot + seeded RNG reproducibility for render/export.
- Persistence discipline: IndexedDB for large/structured assets (soundbanks/samples); LocalStorage v2 for patterns/scenes/undo. Revoke old blob URLs when replacing samples; persist manifest + blob; avoid storing large blobs unnecessarily.

## Scope Governor (for any request)

- Produce a Scope Contract: bullet list of what will change (files/modules) and what will **not** change.
- If unclear, ask up to 3 targeted questions; otherwise proceed with best effort and document assumptions in English.
- Do not implement nice-to-have refactors/renames/formatting-only/architectural migrations unless explicitly requested.

## Project Map (authoritative)

- Stores: `stores/` (transport, patterns/scenes, session caps, soundbanks, control, browser).
- Composables: `composables/` (audio engine, scheduler, sequencer, MIDI/sync, import/export, audio input, storage).
- Domain: `domain/` (timing/quantize/velocity).
- UI shell: `pages/index.vue` + `components/DrumMachine.vue`.
- Diagrams as truth: `diagrams/*.md` (consult before altering flows).
- Mount reality rule: verify components are actually mounted before wiring logic.

## Quality Gates (always)

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run tests: `npm test` (or repo test command). No acceptance if any gate fails.

## Testing Policy (hard gate)

- For every implemented function or user-facing behavior, add at least one test under `./tests/<appropriate-subfolder>/...`.
- Component behavior → `tests/componentTests/...`.
- Pure logic/store/composable → `tests/unitTests/...`.
- Tests must validate observable outcomes, not just “method was called” (unless that is the only stable observable).
- If tests fail, fix implementation/tests until all pass. No partial acceptance.

## Tooltip + Shortcut Policy (global)

- If a control is keyboard-triggerable, assign a shortcut via the global shortcut registry.
- Show the shortcut on hover via title or minimal Vuetify tooltip. Do not add new UI chrome/help panels unless requested.

## Definition of Done (required for every change set)

- **Functional**: requested behaviors implemented and verifiable; no unrelated features; UI behavior matches existing interaction patterns (SHIFT modifiers, soft button conventions, control store routing).
- **UI & UX Safety**: no unintended layout/style changes; display stays within 100vh; no new page scroll unless explicitly requested.
- **Code Quality**: Options API maintained; no Composition API; TypeScript strict passes; clean minimal diff; no formatting-only changes.
- **Performance & Stability**: no scheduler timing regressions; browser/file lists use scroll containers properly; persistence uses IndexedDB appropriately; avoid heavy sync loops on UI thread.
- **Documentation**: new comments/docs in English; update diagrams/docs when flows change materially.
- **Tests**: each implemented function/behavior has a test in `./tests/...`; all tests pass locally; lint + typecheck pass.
- **Deliverables**: list of changed files; short English changelog; exact commands to run lint/typecheck/tests; brief verification notes (what to click/press to confirm).

## Current Active Change Request (example template)

When a user provides a change request, respond with:

- Scope Contract (will change / won’t change)
- Implementation Plan (ordered, minimal)
- Test Plan (which tests, expected outcomes)
- DoD checklist mapping (how each DoD item will be satisfied)