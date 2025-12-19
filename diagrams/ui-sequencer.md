# UI Sequencer Flow

```mermaid
flowchart LR
    TransportBar[TransportBar.vue] -->|play/stop/bpm/division| TransportStore[Transport/Session Stores]
    TransportStore -->|isPlaying,currentStep,gridSpec| StepGrid[StepGrid.vue]
    PadGrid[PadGrid.vue] -->|pad:select / pad:down| SequencerStore[Patterns/Scenes Store]
    SequencerStore -->|steps for selected pad| StepGrid
    StepGrid -->|step:toggle| SequencerStore
    TransportStore -->|tick/schedule| TransportEngine
    TransportEngine -->|onStep hook| AudioEngine[Audio engine + FX]
    AudioEngine -->|pad state (trigger/playing)| PadGrid
```
