# Transport Engine Timing (English)

```mermaid
sequenceDiagram
    participant UI as UI/Stores
    participant Transport as TransportEngine
    participant Clock as RenderClock
    participant Scheduler
    participant Hooks as AudioHooks
    participant Subs as Subscribers

    UI->>Transport: start()
    Transport->>Clock: audioTime()
    Transport->>Transport: set startTimeSec, lastStep
    Transport->>Scheduler: clear() + start()
    Transport->>Scheduler: schedule(next boundary)
    Scheduler-->>Hooks: onStep(stepIndex, audioTime)
    Hooks-->>Subs: (audio pipeline triggered elsewhere)
    loop tick
        UI->>Transport: tick()
        Transport->>Clock: audioTime()
        Transport->>Transport: compute currentStep
        Transport->>Scheduler: schedule(currentStep+1 with swing)
        Transport-->>Subs: emit state {isPlaying, currentStep}
    end
    UI->>Transport: setConfig(bpm/division/swing)
    Transport->>Clock: audioTime()
    Transport->>Transport: recompute startTimeSec for phase
    Note over Transport,Scheduler: Pending queue not cleared; old timings may still fire
    UI->>Transport: stop()
    Transport->>Scheduler: stop(); clear()
    Transport-->>Subs: emit stopped state
```
