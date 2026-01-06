# Transport Engine Timing (English)

```mermaid
sequenceDiagram
    participant UI as UI/Stores
    participant Transport as TransportEngine
    participant Clock as RenderClock
    participant Scheduler as StepScheduler
    participant Hooks as AudioHooks
    participant Subs as Subscribers

    UI->>Transport: start()
    Transport->>Clock: audioTime()
    Transport->>Transport: set startTimeSec + lastStep
    Transport->>Scheduler: clear()
    Transport->>Scheduler: start()
    Transport->>Scheduler: schedule(nextBoundary)
    Scheduler-->>Hooks: onStep(stepIndex, audioTime)
    Hooks-->>Subs: audio pipeline elsewhere

    loop tick
        UI->>Transport: tick()
        Transport->>Clock: audioTime()
        Transport->>Transport: compute currentStep
        Transport->>Scheduler: schedule(step+1, swing)
        Transport-->>Subs: emit isPlaying + currentStep
    end

    UI->>Transport: setConfig(bpm/division/swing)
    Transport->>Clock: audioTime()
    Transport->>Transport: recompute startTimeSec (phase)
    Note over Transport,Scheduler: clear/reseed to avoid stale queued steps

    UI->>Transport: stop()
    Transport->>Scheduler: stop()
    Transport->>Scheduler: clear()
    Transport-->>Subs: emit stopped
```

## MK3 transport mapping (placeholders + hover hints)

```mermaid
stateDiagram-v2
    [*] --> Stopped
    Stopped --> Playing: Play ▶
    Playing --> Stopped: Play/Stop ■
    Stopped --> CountingIn: Shift+Rec (Count-In ♩)
    CountingIn --> Recording: Count-in done
    Playing --> Recording: Rec ●
    Recording --> Playing: Rec ● (toggle)
    Stopped --> Stopped: Stop ■ (reset playhead)
    Playing --> Stopped: Stop ■ (reset)
    Playing --> Playing: Restart ↻ (jump to step 0)
```

- Transport cluster placeholder should expose hover hints for primary + shift: Play ▶ (toggle), Stop ■ (press twice = reset), Rec ● (hold = Pattern Preset length), Restart ↻ (shift+stop), Tap ☼, Loop ⟳, Metronome ♬, Count-In ♩, Follow ⇥.
- Ensure the transport row stays within the left column and never forces a page scroll; stack controls into two compact rows with icons + labels so it fits under the dual displays.
