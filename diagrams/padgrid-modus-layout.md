# PadGrid & Modus-Layout

Das Schema zeigt, wie PadGrid, Modus-Spalte und die oberen Buttonreihen an den Softbutton-Referenzlinien ausgerichtet sind. Display 1 (links) und Display 2 (rechts) bilden die obere Achse; die Softbuttons darüber liefern die vertikale Referenz (Softbutton 4 über Display 1) für die Modus-Spalte und die horizontale Referenz (Softbuttons über Display 2) für die Fixed-Velocity/Pad-Mode-Zeile.

```mermaid
flowchart TB
  %% Softbuttons + Referenzen
  subgraph soft["Softbuttons 1–8 (oben)"]
    direction LR
    sb1["SB1"]:::softbtn
    sb2["SB2"]:::softbtn
    sb3["SB3"]:::softbtn
    sb4["SB4\nVertikale Referenzlinie"]:::ref
    sb5["SB5"]:::softbtn
    sb6["SB6"]:::softbtn
    sb7["SB7"]:::softbtn
    sb8["SB8"]:::softbtn
  end

  %% Displays
  subgraph displays["Dual Displays"]
    direction LR
    disp1["Display 1 (links)"]:::display
    disp2["Display 2 (rechts)"]:::display
  end

  %% Referenzlinien
  refV["Ausrichtung Modus-Spalte\n(Vertikale Linie SB4)"]:::ref
  refH["Horizontale Referenz:\nSoftbuttons über Display 2"]:::ref

  %% Upper buttons (Fixed Velocity + Pad Modes)
  upperRow["Fixed Velocity  |  PAD MODE  |  KEYBOARD  |  CHORD  |  STEP"]:::upper

  %% Main surface
  subgraph surface["Bedienoberfläche (schematisch)"]
    direction LR
    subgraph modes["Modus-Buttons (links)\n8 Stück, je 2 Pad-Höhen\nAusrichtung: Linie SB4"]
      m1["Mode 1"]:::mode
      m2["Mode 2"]:::mode
      m3["Mode 3"]:::mode
      m4["Mode 4"]:::mode
      m5["Mode 5"]:::mode
      m6["Mode 6"]:::mode
      m7["Mode 7"]:::mode
      m8["Mode 8"]:::mode
    end

    subgraph pads["PadGrid 4×4 (rechts)\npad1–pad16\nStates: selected / triggered / playing\nPattern Indicator"]:::pads
      pgrid["4×4 Pads"]:::pads
    end
  end

  %% Relations
  soft --> displays
  sb4 -. Vertikale Referenz .- refV
  refV -. Linie .- modes
  soft -. Marker .- refH
  refH --> upperRow
  upperRow --> modes
  upperRow --> pads
  modes --> pads
  displays --> upperRow

  classDef softbtn fill:#1f2430,stroke:#6a7da8,color:#e4ecff;
  classDef display fill:#0f141f,stroke:#4d5a78,color:#d8e3ff;
  classDef pads fill:#1a1f2b,stroke:#f6a821,color:#ffeac2;
  classDef mode fill:#131722,stroke:#56b2e5,color:#d9f2ff;
  classDef upper fill:#1c2230,stroke:#8ac6ff,color:#e7f4ff;
  classDef ref stroke-dasharray: 4 2,stroke:#ff7f11,color:#ff7f11,fill:#fff2e6;
```

**Legende**
- Softbuttons 1–8 bilden die obere Linie; Softbutton 4 markiert die vertikale Referenz der Modus-Spalte.
- Display 1 sitzt links, Display 2 rechts; die Softbuttons über Display 2 definieren die horizontale Referenz für Fixed Velocity + PAD MODE…STEP.
- Modus-Buttons stehen links vom PadGrid, sind eine Spalte breit und jeweils 2 Pad-Höhen hoch (8 Stück).
- Fixed Velocity plus die Reihe PAD MODE bis STEP liegt oberhalb der Modus-Spalte und orientiert sich an der Softbutton-Linie von Display 2.
- PadGrid ist 4×4 (pad1–pad16) mit Zuständen selected/triggered/playing und einem Pattern Indicator im Bereich des Grids.
