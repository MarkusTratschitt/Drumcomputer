# Core Components Class Diagram

```mermaid
classDiagram
  class DrumMachine {
    +start()
    +stop()
    +updateBpm(bpm)
    +setDivision(div)
    +selectPad(padId)
    +exportBounce()
  }

  class TransportBar {
    +play()
    +stop()
    +updateBpm(bpm)
    +updateDivision(div)
    +toggleLoop()
    +toggleMidiLearn()
  }

  class PadGrid {
    +pads: DrumPadId[]
    +padStates: PadState map
    +selectPad(padId)
    +triggerPad(padId, velocity)
  }

  class PatternsPanel {
    +addPattern(name)
    +renamePattern(id, name)
    +undo()
    +redo()
    +addScene(name, patternIds)
    +selectScene(id)
  }

  class ExportPanel {
    +export()
    +downloadMixdown()
    +downloadZip()
    +downloadStem(padId)
  }

  class TransportStore {
    +bpm
    +isPlaying
    +gridSpec
    +setBpm(bpm)
    +setGridSpec(spec)
    +setLoop(loop)
  }

  class PatternsStore {
    +patterns
    +scenes
    +toggleStep(bar, step, pad)
    +setStepVelocity(...)
    +updateGridSpec(spec)
    +prepareScenePlayback()
    +advanceScenePlayback()
  }

  class SoundbanksStore {
    +banks
    +currentBank
    +upsertBank(bank)
    +selectBank(id)
  }

  class Sequencer {
    +start()
    +stop()
    +recordHit(pad, velocity, quantize)
    +applySoundbank(bank)
    +setFx(settings)
  }

  DrumMachine --> TransportBar : renders
  DrumMachine --> PadGrid : renders
  DrumMachine --> PatternsPanel : renders (drawer)
  DrumMachine --> ExportPanel : renders (drawer)
  DrumMachine --> Sequencer : drives playback/record
  DrumMachine --> TransportStore : reads/writes transport state
  DrumMachine --> PatternsStore : reads/writes patterns/scenes
  DrumMachine --> SoundbanksStore : reads/writes soundbanks
  Sequencer --> PatternsStore : reads steps
  Sequencer --> SoundbanksStore : uses pad samples
  TransportBar --> TransportStore : updates BPM/division/loop/play
  PadGrid --> Sequencer : record hits
  ExportPanel --> DrumMachine : triggers export/download flows
```
