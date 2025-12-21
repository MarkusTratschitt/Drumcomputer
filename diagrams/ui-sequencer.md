# UI Sequencer Flow

```mermaid
flowchart LR
    TransportBar[TransportBar.vue] -->|play/stop/bpm/division| TransportStore[Transport/SessionStores]
    TransportStore -->|isPlaying,currentStep,gridSpec| StepGrid[StepGrid.vue]
    PadGrid[PadGrid.vue] -->|pad:select / pad:down| SequencerStore[Patterns/ScenesStore]
    SequencerStore -->|steps for selected pad| StepGrid
    StepGrid -->|step:toggle| SequencerStore
    TransportStore -->|tick/schedule| TransportEngine
    TransportEngine -->|onStep hook| AudioEngine[AudioEngine+FX]
    AudioEngine -->|pad state (trigger/playing)| PadGrid
```
