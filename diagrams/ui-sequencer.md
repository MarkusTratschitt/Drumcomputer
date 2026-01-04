# UI Sequencer Flow

```mermaid
flowchart LR
    TransportBar["TransportBar.vue"]
    TransportStore["Transport / Session Stores"]
    StepGrid["StepGrid.vue"]
    PadGrid["PadGrid.vue"]
    SequencerStore["Patterns / Scenes Store"]
    TransportEngine["Transport Engine"]
    AudioEngine["Audio Engine<br/>+ FX"]

    TransportBar -->|"play · stop · bpm · division"| TransportStore
    TransportStore -->|"isPlaying · currentStep · gridSpec"| StepGrid

    PadGrid -->|"pad select / pad down"| SequencerStore
    SequencerStore -->|"steps for selected pad"| StepGrid
    StepGrid -->|"step toggle"| SequencerStore

    TransportStore -->|"tick / schedule"| TransportEngine
    TransportEngine -->|"onStep hook"| AudioEngine
    AudioEngine -->|"pad state (trigger / playing)"| PadGrid
```

## MK3 surface + hover hints

```mermaid
flowchart TB
  Displays["Dual Displays\n(soft labels + status bars)"]
  SoftButtons["Soft Buttons 1-8\n(symbol + hint tooltip)"]
  ScreenKnobs["8 Screen Knobs\n(selector overlay on hover/touch)"]
  Encoder["4D Encoder + Push\n(nav arrows ↕↔ + confirm)"]
  Modes["Mode Column\n(Scene/Pattern/Events/Variation/Duplicate/Select/Mute/Solo + Shift)"]
  Transport["Transport Cluster\n(Play ▶ / Stop ■ / Rec ● / Restart ↻ / Loop ⟳ / Tap ☼)"]
  TouchStrip["Touch Strip ≡\n(perform/aftertouch placeholder)"]
  Pads["Pad Grid 4×4\n(labels + key legends + hover hint)"]

  Displays --- SoftButtons
  Displays --- ScreenKnobs
  ScreenKnobs --> Encoder
  SoftButtons --> Displays
  Modes --> Pads
  Transport --> Pads
  TouchStrip --> Pads
  Pads --> Displays
```

- Fit everything inside a `100vh` stage: displays + buttons at top, pad square anchored bottom-right, transport + mode columns on the left, touch strip on the right. Only drawers scroll internally.
- Hover hints must show both the primary and shift-layer action (e.g., “MUTE (hold to momentary) / SHIFT: SOLO”), and selector overlays appear when hovering a screen knob to mimic MK3 lists.
