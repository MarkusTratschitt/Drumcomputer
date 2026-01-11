# Browser Workflow-Vergleich: Manual vs. Implementierung

## Einleitung

Dieses Dokument vergleicht die Browser-Funktionalität aus dem MASCHINE 2.0 MK3 Manual (Seiten 173-238, deutsche Ausgabe) mit der aktuellen Implementierung im Drumcomputer-Projekt. Ziel ist es, identische Workflows zu identifizieren und Lücken in der Implementierung aufzudecken.

## Übersicht: Manual-Funktionen

### Aus dem Manual (Seiten 173-238)

Der Browser im MASCHINE MK3 bietet zwei Hauptmodi:
1. **LIBRARY-Bereich**: Durchsuchen der MASCHINE-Library mit Tags, Filtern, Produkten
2. **FILES-Bereich**: Dateisystem-Navigation mit Ordner-Import in die Library

#### Kern-Features aus dem Manual:

1. **Dual-Display-Organisation** (Seite 179)
   - Linkes Display: Suche eingrenzen (Type, Content, Category, Product, Bank, Sub-Bank)
   - Rechtes Display: Suche verfeinern (Type, Character, Ergebnisliste)
   
2. **4-D-Encoder-Navigation** (Seite 180)
   - Links/Rechts: Feld-Auswahl zwischen Filtern
   - Drehen: Wert im Feld ändern
   - Nach rechts: Zur Ergebnisliste wechseln
   - Drehen in Ergebnisliste: Element auswählen
   - Drücken: Auswahl laden
   - Dünne Klammern zeigen aktives Feld

3. **Produkt-Wähler** (Seiten 180-185)
   - Produkt-Kategorie wählen (Drums & Percussion, Sampled Instruments, Synthesizers, Other/Sounds.com)
   - Nach Vendor filtern
   - Bank auswählen
   - Sub-Bank auswählen
   - Produkt direkt laden mit Default-Preset

4. **Dateityp-Filter** (Seite 176)
   - 7 Symbole: Project, Group, Sound, Instrumenten-Preset, Effekt-Preset, Loops, One-Shots
   
5. **Inhalte-Wähler** (Seite 177)
   - Factory vs. User Content

6. **Type- und Character-Filter** (Seite 177)
   - Type-Tags für Kategorisierung
   - Character-Tags für Klangcharakter

7. **Textsuche** (Seite 177)
   - Suchfeld für Freitext-Queries

8. **FILES-Bereich Funktionen** (Seiten 230-232)
   - Kontext-Menü-Befehle:
     - Add to Favorites (Ordner)
     - Import to Library (Ordner)
     - Refresh (Liste neu laden)
     - Find in Explorer/Finder
     - Sort by Name
     - Sort by Date

9. **Library-Import** (Seiten 231-232)
   - Ordner importieren (nicht Dateien verschieben, nur referenzieren)
   - Import mit automatischer Metadaten-Extraktion aus Pfaden
   - Product/Bank/Sub-Bank aus Ordner-Hierarchie
   - User-Content-Kategorie
   - Pfade in Preferences speichern

10. **Missing Samples Dialog** (Seiten 233-234)
    - Dialog bei fehlenden Samples
    - IGNORE, IGNORE ALL, LOCATE
    - Purge Missing Samples (Kontext-Menü)
    - Find Missing Samples (Kontext-Menü)

11. **Quick-Browse** (Seiten 235-238)
    - Schnelles Wiederaufrufen vorheriger Suchanfragen
    - Für Samples, Plug-in-Presets, Groups, Sounds
    - Im Control-Modus: Button öffnet Quick-Browse mit letzter Suche
    - Kontext-basiert (pro Pad/Sound/Group)
    - Lupen-Symbol neben Datei-Namen

12. **Prehear/Preview** (Seite 177)
    - Vorhör-Button für Samples und Instrumenten-Presets
    - Lautstärke-Fader für Preview
    - Autoload-Option (automatisches Laden bei Auswahl)

13. **Favorites-System**
    - Favoriten-Markierung
    - Favoriten-Filter

14. **Soft-Button-Funktionen** (Seiten 130-140, Browser-Page)
    - Search / SHIFT: Plug-In Menu
    - Type: Dateityp filtern
    - Tag: Tags filtern
    - Favorites: Favoriten anzeigen
    - Prehear / SHIFT: Stop
    - Load: Auswahl laden
    - Replace: Auswahl ersetzen
    - Clear: Auswahl löschen

15. **Recent-Page**
    - Recent: Letzte Dateien
    - Clear Recent
    - Fav: Als Favorit markieren
    - Tag: Tag hinzufügen
    - Load Recent
    - Prehear/Stop

---

## Implementierungs-Status

### ✅ VOLLSTÄNDIG IMPLEMENTIERT

#### 1. Browser Store (`stores/browser.ts`)
- ✅ Dual-Mode: LIBRARY und FILES
- ✅ Query-basierte Suche
- ✅ Erweiterte Filter (BrowserFilters):
  - fileType, contentType, category, product, bank, subBank, character, tags, favorites
- ✅ Filter-Anwendung mit `setFilter()`, `clearFilters()`, `applyFilters()`
- ✅ Sortierung (SortMode):
  - name-asc, name-desc, date-asc, date-desc, relevance
- ✅ Display-Models für Dual-Display (`toDisplayModels()`)
- ✅ Hierarchie-Cache für Category/Product/Bank/Sub-Bank
- ✅ Recent Files Integration
- ✅ Favorites-System Integration
- ✅ Tag-Dialog-System
- ✅ Search Debouncing (300ms)

#### 2. 4D-Encoder Composable (`composables/use4DEncoder.ts`)
- ✅ State-Machine mit 3 Modi:
  - field-select, value-adjust, list-navigate
- ✅ Tilt Horizontal/Vertical
- ✅ Turn (Drehen)
- ✅ Press (Drücken)
- ✅ Felder mit Options/Min/Max/Step
- ✅ Encoder-Felder aus Browser-Store (`getEncoderFields()`)

#### 3. Recent Files (`composables/useRecentFiles.ts`)
- ✅ localStorage-basiertes Tracking
- ✅ Deduplizierung
- ✅ Max 50 Einträge
- ✅ Sortierung nach Timestamp
- ✅ addRecent, getRecent, clearRecent, removeRecent

#### 4. Quick-Browse (`composables/useQuickBrowse.ts`)
- ✅ History-Tracking mit Context-IDs
- ✅ localStorage-Persistence
- ✅ recordBrowse, getLastBrowse, restoreBrowse
- ✅ Kontext-basiert (pad-{index}, plugin-{soundIndex}-{slotIndex}, sound-{index})
- ✅ Max 50 Einträge

#### 5. Sample Preview (`composables/useSamplePreview.client.ts`)
- ✅ AudioContext-basiertes Playback
- ✅ loadAndPlay, stop, pause, resume, seek
- ✅ Progress-Tracking mit requestAnimationFrame
- ✅ PreviewState (isPlaying, currentFile, progress, duration)
- ✅ Blob-Support

#### 6. Library Repository (`services/libraryRepository.ts`)
- ✅ search() mit Query und Filters
- ✅ addTag, removeTag, getTags
- ✅ importFile mit Metadaten
- ✅ Favorites (addToFavorites, removeFromFavorites, getFavorites, isFavorite)
- ✅ Hierarchie-Queries (getCategories, getProducts, getBanks, getSubBanks)
- ✅ Metadaten-Extraktion aus Pfaden (extractMetadataFromPath)
- ✅ IndexedDB-Migration für große Libraries (>50 Items)
- ✅ localStorage-Fallback für kleine Collections

#### 7. Dual-Display Integration
- ✅ DisplayPanelModel für linkes/rechtes Display
- ✅ Browser-View und File-View
- ✅ Items mit title, subtitle, active, value
- ✅ Filter-Beschreibung in Summary
- ✅ Sort-Mode-Anzeige
- ✅ Favoriten-Symbol (★) in Subtitle
- ✅ Windowing für große Ergebnismengen (max 100 Items)

#### 8. Browser-Store Actions
- ✅ setMode(mode)
- ✅ setQuery(query) mit Debouncing
- ✅ search()
- ✅ setFilter(key, value)
- ✅ clearFilters()
- ✅ selectResult(id)
- ✅ selectPath(path)
- ✅ listDir(path)
- ✅ importSelected(context)
- ✅ toggleFavorite(itemId)
- ✅ setSortMode(mode)
- ✅ sortResults()
- ✅ loadRecentFiles()
- ✅ openQuickBrowse(contextId)
- ✅ prehearSelected()
- ✅ stopPrehear()
- ✅ openTagDialog(itemId)
- ✅ closeTagDialog()
- ✅ addTagToSelected(tag)
- ✅ removeTagFromSelected(tag)

---

### ⚠️ TEILWEISE IMPLEMENTIERT

#### 1. File System Access API (`services/fileSystemRepository.ts`)
- ⚠️ **Status**: Memory-basiertes Stub-System vorhanden
- ⚠️ **Fehlt**: 
  - Echte Browser File System Access API Integration
  - `window.showDirectoryPicker()` für User-Permission
  - FileSystemDirectoryHandle-Verwaltung
  - readFileBlob() Implementation (Interface vorhanden, aber nicht bei allen Repos)
- ⚠️ **Vorhanden**:
  - listDir() Interface
  - stat() Interface
  - readFileMeta() Interface
  - Memory-basierte Fallback-Implementierung

#### 2. Import-Workflow mit Progress
- ⚠️ **Status**: ImportProgress-Interface definiert, aber nicht vollständig implementiert
- ⚠️ **Fehlt**:
  - `importDirectory()` Implementation mit onProgress-Callback
  - Rekursiver Import-Modus
  - Fortschritts-Feedback im UI
  - Fehlersammlung und -Reporting
- ⚠️ **Vorhanden**:
  - importFile() für einzelne Dateien
  - Metadaten-Extraktion (extractMetadataFromPath)
  - ImportProgress Type-Definition im Interface

#### 3. Control-Store Browser-Integration
- ⚠️ **Status**: Soft-Buttons definiert, aber 4D-Encoder nicht vollständig verdrahtet
- ⚠️ **Fehlt**:
  - Encoder4D-State im Control-Store
  - tiltEncoder4D(), turnEncoder4D(), pressEncoder4D() Actions
  - Encoder-zu-Browser-Filter Synchronisation
  - Display-Highlight für aktives Feld (dünne Klammern)
- ⚠️ **Vorhanden**:
  - Browser-Page mit Soft-Buttons
  - Recent-Page Definition
  - applyAction() für BROWSER_LOAD, BROWSER_SEARCH, etc.
  - setBrowserDisplay() für Display-Update

#### 4. Tag-Management UI-Flow
- ⚠️ **Status**: Backend vorhanden, aber UI-Dialog-Integration nicht vollständig
- ⚠️ **Fehlt**:
  - Encoder-Navigation im Tag-Dialog (Turn durch Tags, Press zum Toggle)
  - Close-Button-Verdrahtung im Dialog
  - Display-Overlay-Rendering (könnte in DualDisplay fehlen)
- ⚠️ **Vorhanden**:
  - openTagDialog(), closeTagDialog() Actions
  - addTagToSelected(), removeTagFromSelected()
  - Tag-Dialog Display-Models
  - availableTags Collection

---

### ❌ NICHT IMPLEMENTIERT

#### 1. Missing Samples Dialog
- ❌ **Fehlt komplett**:
  - Detection von fehlenden Samples beim Pattern/Project-Laden
  - Missing-Sample-Dialog-State
  - IGNORE, IGNORE ALL, LOCATE Actions
  - Purge Missing Samples (Kontext-Menü)
  - Find Missing Samples (Kontext-Menü)
  - Ausrufungszeichen-Markierung bei Sounds/Groups mit fehlenden Samples
- **Relevant für**: Pattern-/Project-Import mit Sample-Referenzen

#### 2. Produkt-Wähler erweiterte Features
- ❌ **Fehlt**:
  - Category/Vendor-Umschaltung im UI
  - Produkt direkt laden mit Default-Preset (Pfeil-Symbol)
  - Produkt-Liste mit Symbolen
  - Bank-Menü unter Produkt-Wähler
  - Kreuz-Symbol zum Zurücksetzen der Auswahl
- ⚠️ **Vorhanden** (nur Backend):
  - Hierarchie-Filterung (Category → Product → Bank → Sub-Bank)
  - getCategories, getProducts, getBanks, getSubBanks

#### 3. Autoload-Funktion
- ❌ **Fehlt**:
  - Autoload-Button in Control-Zeile
  - Automatisches Laden von Samples bei Auswahl
  - State für Autoload-Modus
- **Hinweis**: Könnte als User-Preference implementiert werden

#### 4. Load Patterns Checkbox (für Groups)
- ❌ **Fehlt**:
  - Checkbox "Load Patterns" in Control-Zeile
  - Option zum Laden von Group mit Patterns
- **Relevant für**: Group-Import

#### 5. Info-Button (Datei-Informationen)
- ❌ **Fehlt**:
  - Info-Button ("i"-Symbol) in Control-Zeile
  - Datei-Informationen-Dialog
  - Anzeige von Datei-Metadaten (Size, Format, Sample-Rate, Bit-Depth, etc.)

#### 6. EDIT-Button (Attribut-Editor)
- ❌ **Fehlt**:
  - EDIT-Button in Control-Zeile
  - Attribut-Editor für Bulk-Editing
  - Batch-Tag-Zuweisung
- **Hinweis**: Tag-Dialog existiert für einzelne Items, aber kein Bulk-Editor

#### 7. FILES-Bereich Kontext-Menü
- ❌ **Fehlt komplett**:
  - Add to Favorites (Ordner)
  - Refresh (Liste neu laden)
  - Find in Explorer/Finder (OS-Integration)
- ⚠️ **Vorhanden**:
  - Import to Library (via importSelected)
  - Sort by Name/Date (via sortResults)

#### 8. Controller-spezifische Features
- ❌ **Fehlt**:
  - SHIFT-Modifier für Soft-Buttons (z.B. Search → Plug-In Menu)
  - Button 8 Quick-Browse im Control-Modus
  - Button 3 (Lupe) Quick-Browse im Browse-Modus
  - Drehregler-Steuerung für Felder
- **Hinweis**: Projekt fokussiert auf Web-UI, Controller-Integration nicht primär

#### 9. Preferences-Integration
- ❌ **Fehlt**:
  - Library-Page in Preferences
  - User-Libraries-Pfade-Verwaltung
  - Automatisches Hinzufügen von Import-Pfaden
- **Hinweis**: localStorage wird genutzt, aber keine UI für Pfad-Verwaltung

#### 10. Ordner-Favoriten (FILES-Bereich)
- ❌ **Fehlt**:
  - Favoriten-Liste für Ordner (nicht Dateien)
  - Add to Favorites für Ordner
  - Schnellzugriff auf Favoriten-Ordner
- **Hinweis**: Favoriten existieren nur für Library-Items, nicht für Dateien/Ordner

---

## Workflow-Vergleich: Identisch vs. Abweichend

### ✅ IDENTISCHE WORKFLOWS

#### Workflow 1: Sample in Library suchen und laden
**Manual (Seite 178-179)**:
1. BROWSER drücken
2. Dateityp wählen (One-Shot)
3. Factory/User wählen
4. Optional: Product, Bank, Sub-Bank wählen
5. Optional: Type/Character-Tags wählen
6. Ergebnisliste durchblättern mit 4D-Encoder
7. 4D-Encoder drücken oder LOAD-Button

**Implementierung**:
1. Browser-Store: setMode('LIBRARY')
2. Browser-Store: setFilter('fileType', 'sample')
3. Browser-Store: setFilter('contentType', 'factory' | 'user')
4. Optional: setFilter('product', ...), setFilter('bank', ...)
5. Optional: setFilter('tags', [...])
6. Browser-Store: selectResult(id)
7. Browser-Store: importSelected()

✅ **Identisch**: Gleiche Schritte, gleiche Logik

---

#### Workflow 2: Recent Files anzeigen
**Manual (Seite 235)**:
1. Recent-Page öffnen
2. Liste der zuletzt geladenen Dateien
3. Datei auswählen und laden

**Implementierung**:
1. Browser-Store: loadRecentFiles()
2. Browser-Store: recentFiles Getter
3. Browser-Store: selectResult(id) → importSelected()

✅ **Identisch**: Recent-Tracking funktioniert wie im Manual

---

#### Workflow 3: Quick-Browse nutzen
**Manual (Seiten 235-238)**:
1. Pad/Sound auswählen
2. Lupen-Symbol klicken
3. Letzte Suchanfrage wird wiederhergestellt
4. Andere Samples aus gleicher Suche wählen

**Implementierung**:
1. Context-ID bestimmen (z.B. 'pad-0')
2. Browser-Store: openQuickBrowse(contextId)
3. useQuickBrowse: getLastBrowse(contextId)
4. Browser-Store: restoreBrowse(entry)

✅ **Identisch**: Kontext-basierte History wie im Manual

---

#### Workflow 4: Sample vorhören (Prehear)
**Manual (Seite 177)**:
1. Sample in Ergebnisliste auswählen
2. Prehear-Button drücken
3. Sample wird abgespielt
4. Stop-Button zum Beenden

**Implementierung**:
1. Browser-Store: selectResult(id)
2. Browser-Store: prehearSelected()
3. useSamplePreview: loadAndPlay(path, blob)
4. Browser-Store: stopPrehear()

✅ **Identisch**: Preview-Funktionalität vorhanden

---

#### Workflow 5: Favorites markieren und filtern
**Manual (diverse Seiten)**:
1. Datei auswählen
2. Favoriten-Button drücken
3. Favoriten-Filter aktivieren
4. Nur Favoriten anzeigen

**Implementierung**:
1. Browser-Store: selectResult(id)
2. Browser-Store: toggleFavorite(id)
3. Browser-Store: setFilter('favorites', true)
4. Browser-Store: applyFilters()

✅ **Identisch**: Favorites-System vollständig

---

#### Workflow 6: Sortierung ändern
**Manual (Seite 230)**:
1. Kontext-Menü öffnen
2. "Sort by Name" oder "Sort by Date" wählen
3. Liste wird sortiert

**Implementierung**:
1. (Kontext-Menü nicht implementiert, aber Encoder-Field)
2. Browser-Store: setSortMode('name-asc' | 'name-desc' | 'date-asc' | 'date-desc')
3. Browser-Store: sortResults()

✅ **Identisch**: Sortierung funktioniert, nur UI-Trigger unterschiedlich

---

### ⚠️ ABWEICHENDE/UNVOLLSTÄNDIGE WORKFLOWS

#### Workflow 7: Ordner in Library importieren
**Manual (Seiten 231-232)**:
1. FILES-Bereich öffnen
2. Ordner navigieren
3. Ordner auswählen
4. IMPORT-Button klicken
5. Attribut-Editor öffnet sich
6. Tags vergeben
7. OK klicken
8. Alle Dateien im Ordner werden importiert
9. Pfad wird in Preferences gespeichert

**Implementierung**:
1. Browser-Store: setMode('FILES')
2. Browser-Store: listDir(path)
3. Browser-Store: selectPath(path)
4. Browser-Store: importSelected()
5. ❌ **Fehlt**: Attribut-Editor vor Import
6. ❌ **Fehlt**: Tag-Vergabe beim Import
7. ❌ **Fehlt**: Rekursiver Ordner-Import
8. ⚠️ **Vorhanden**: importFile() für einzelne Dateien
9. ❌ **Fehlt**: Preferences-Integration

⚠️ **Abweichend**: Import funktioniert nur für einzelne Dateien, nicht für Ordner mit Attribut-Editor

---

#### Workflow 8: 4D-Encoder-Navigation
**Manual (Seite 180)**:
1. 4D-Encoder nach links/rechts: Feld wählen
2. Dünne Klammern zeigen aktives Feld
3. 4D-Encoder drehen: Wert ändern
4. 4D-Encoder nach rechts: Zur Ergebnisliste
5. 4D-Encoder drehen: Element wählen
6. 4D-Encoder drücken: Laden

**Implementierung**:
1. ✅ use4DEncoder: tiltHorizontal('left' | 'right')
2. ❌ **Fehlt**: Display-Highlight (dünne Klammern)
3. ✅ use4DEncoder: turn(delta)
4. ✅ use4DEncoder: tiltVertical('down')
5. ✅ use4DEncoder: turn(delta) in list-navigate mode
6. ⚠️ **Fehlt**: Verdrahtung zu importSelected() in Control-Store

⚠️ **Abweichend**: Encoder-Logik vorhanden, aber Control-Store-Verdrahtung unvollständig

---

#### Workflow 9: Fehlende Samples suchen
**Manual (Seiten 233-234)**:
1. Project laden mit fehlenden Samples
2. "Missing Sample"-Dialog erscheint
3. Optionen: IGNORE, IGNORE ALL, LOCATE
4. Bei LOCATE: Datei-Dialog öffnet sich
5. Neues Sample auswählen
6. Später: "Find Missing Samples" im Kontext-Menü

**Implementierung**:
1. ❌ **Nicht implementiert**: Kein Detection-System
2. ❌ **Nicht implementiert**: Kein Dialog
3. ❌ **Nicht implementiert**: Keine Actions
4. ❌ **Nicht implementiert**: Kein Datei-Dialog
5. ❌ **Nicht implementiert**: Kein Kontext-Menü
6. ❌ **Nicht implementiert**: Keine Purge/Find-Funktionen

❌ **Fehlt komplett**: Missing Samples Feature nicht vorhanden

---

#### Workflow 10: Ordner zu Favoriten hinzufügen (FILES)
**Manual (Seite 230)**:
1. FILES-Bereich öffnen
2. Ordner navigieren
3. Ordner-Kontext-Menü öffnen
4. "Add to Favorites" wählen
5. Ordner erscheint in Favoriten-Liste

**Implementierung**:
1. ✅ Browser-Store: setMode('FILES')
2. ✅ Browser-Store: listDir(path)
3. ❌ **Fehlt**: Kontext-Menü für Ordner
4. ❌ **Fehlt**: Add to Favorites für Ordner
5. ❌ **Fehlt**: Favoriten-Liste für Ordner

❌ **Fehlt**: Ordner-Favoriten nicht implementiert (nur Library-Item-Favorites)

---

## Detaillierter Implementierungsplan

### Phase 1: Kritische Lücken schließen (High Priority)

#### 1.1 Control-Store 4D-Encoder-Integration
**Dateien**: `stores/control.ts`

**Änderungen**:
- Import `use4DEncoder` Composable
- State erweitern: `encoder4D: ReturnType<typeof use4DEncoder> | null`
- Bei `setMode('BROWSER' | 'FILE')`:
  - Initialisiere `encoder4D` (mit `markRaw()`)
  - Hole Fields von `browser.getEncoderFields()`
  - Setze Fields via `encoder4D.setFields(fields)`
- Neue Actions:
  - `tiltEncoder4D(direction)`: Leitet zu `encoder4D.tiltHorizontal/Vertical()` weiter
  - `turnEncoder4D(delta)`: Leitet zu `encoder4D.turn()` weiter, synchronisiert mit Browser-Filter
  - `pressEncoder4D()`: Leitet zu `encoder4D.press()` weiter, lädt Item wenn in Liste

**Tests erweitern**: `tests/unitTests/controlBrowserIntegration.spec.ts`
- Encoder-Initialisierung bei Mode-Wechsel
- Feld-Navigation
- Filter-Synchronisation
- Press-Action → importSelected()

**Aufwand**: 4-6 Stunden

---

#### 1.2 File System Access API Integration
**Dateien**: `services/fileSystemRepository.ts`

**Änderungen**:
- Neue Klasse `BrowserFileSystemRepository implements FileSystemRepository`:
  ```typescript
  class BrowserFileSystemRepository {
    private rootHandle: FileSystemDirectoryHandle | null = null
    async requestAccess(): Promise<boolean>
    async listDir(path: string): Promise<DirectoryListing>
    async stat(path: string): Promise<{ isDir: boolean }>
    async readFileMeta(path: string): Promise<{ name: string; extension?: string }>
    async readFileBlob(path: string): Promise<Blob>
  }
  ```
- Feature-Detection:
  ```typescript
  function hasFileSystemAccess(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window
  }
  ```
- `getFileSystemRepository()` erweitern:
  - Wenn File System Access API verfügbar → BrowserFileSystemRepository
  - Sonst → MemoryRepository (Fallback)
- Client-only Guards (`import.meta.client`, `typeof window !== 'undefined'`)

**Tests**: `tests/unitTests/fileSystemRepository.spec.ts`
- Mock `showDirectoryPicker()`
- Directory-Listing
- Blob-Ladung
- Fallback-Strategie

**Aufwand**: 8-12 Stunden

---

#### 1.3 Import-Directory mit Progress
**Dateien**: `services/libraryRepository.ts`

**Änderungen**:
- `importDirectory()` Implementation:
  ```typescript
  async importDirectory(
    path: string,
    options?: { recursive?: boolean },
    onProgress?: (progress: ImportProgress) => void
  ): Promise<void> {
    const repo = getFileSystemRepository()
    const listing = await repo.listDir(path)
    const files = listing.files.filter(file => supportedExtensions.has(getExtension(file.path)))
    const total = files.length
    let completed = 0
    const errors: string[] = []
    
    for (const file of files) {
      try {
        const meta = extractMetadataFromPath(file.path)
        await this.importFile(file.path, meta)
        completed++
        onProgress?.({ total, completed, current: file.name, errors })
      } catch (error) {
        errors.push(`${file.name}: ${error}`)
      }
    }
    
    if (options?.recursive) {
      for (const dir of listing.dirs) {
        await this.importDirectory(dir.path, options, onProgress)
      }
    }
  }
  ```
- Browser-Store Action `importDirectory()` mit Progress-Callback

**Tests**: `tests/unitTests/libraryImport.spec.ts`
- Progress-Callbacks
- Metadaten-Extraktion
- Rekursiver Import
- Fehlerbehandlung

**Aufwand**: 6-8 Stunden

---

### Phase 2: UI/UX-Verbesserungen (Medium Priority)

#### 2.1 Display-Highlight für aktives Encoder-Feld
**Dateien**: `stores/browser.ts`, `components/control/DualDisplay.vue`

**Änderungen**:
- Browser-Store: `toDisplayModels()` erweitern:
  - Encoder-aktives Feld mit dünnen Klammern markieren (z.B. `<Type>` statt `Type`)
  - Control-Store: activeFieldIndex weitergeben
- DualDisplay: Aktives Feld visuell hervorheben (optional)

**Tests**: Visual/Manual Testing

**Aufwand**: 2-4 Stunden

---

#### 2.2 Tag-Dialog Encoder-Navigation
**Dateien**: `stores/control.ts`, `stores/browser.ts`

**Änderungen**:
- Wenn `browser.tagDialogOpen === true`:
  - Encoder-Fields zeigen Tags (bereits in `getEncoderFields()`)
  - `turnEncoder4D()`: Scrollt durch Tags
  - `pressEncoder4D()`: Toggle Tag (addTagToSelected/removeTagFromSelected)
  - `tiltHorizontal('right')`: Schließt Dialog (closeTagDialog)
- Control-Store: Button-Verdrahtung für Tag-Dialog (falls vorhanden)

**Tests**: `tests/unitTests/tagManagement.spec.ts`
- Dialog-Öffnung
- Encoder-Navigation
- Tag Toggle
- Dialog-Schließen

**Aufwand**: 4-6 Stunden

---

#### 2.3 FILES-Bereich: Add to Favorites (Ordner)
**Dateien**: `stores/browser.ts`, neuer Storage-Key

**Änderungen**:
- Neuer State: `favoriteDirectories: string[]`
- localStorage Key: `drumcomputer_favorite_dirs_v1`
- Actions:
  - `addDirectoryToFavorites(path: string)`
  - `removeDirectoryFromFavorites(path: string)`
  - `getFavoriteDirectories(): string[]`
- Display: Favoriten-Liste im FILES-Bereich (linkes Display)
- Soft-Button-Verdrahtung (falls vorhanden)

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 3-4 Stunden

---

#### 2.4 Sortierung: Kontext-Menü-Simulation
**Dateien**: `stores/browser.ts`, `stores/control.ts`

**Änderungen**:
- Bereits implementiert: setSortMode(), sortResults()
- UI-Integration:
  - Encoder-Field "Sort" zeigt Optionen (bereits in getEncoderFields)
  - Control-Store: turnEncoder4D() ändert Sort-Mode
- Optional: Kontext-Menü-Komponente (außerhalb Scope)

**Tests**: Bereits vorhanden

**Aufwand**: 1-2 Stunden (nur UI-Verdrahtung)

---

### Phase 3: Erweiterte Features (Low Priority)

#### 3.1 Missing Samples Dialog
**Dateien**: Neue Composable `composables/useMissingSamples.ts`, `stores/browser.ts`

**Änderungen**:
- `useMissingSamples()` Composable:
  ```typescript
  interface MissingSample {
    id: string
    name: string
    originalPath: string
    usedIn: string[] // Sound/Group-IDs
  }
  
  function useMissingSamples() {
    const missingSamples = ref<MissingSample[]>([])
    
    async function detectMissing(): Promise<void>
    function ignoreSample(id: string): void
    function ignoreAll(): void
    async function findSample(id: string, newPath: string): Promise<void>
    function purgeSample(id: string): void
  }
  ```
- Integration in Pattern/Project-Load-Flow:
  - Nach Laden: `detectMissing()`
  - Wenn `missingSamples.length > 0`: Dialog öffnen
- Browser-Store: `missingSamplesDialogOpen`, `missingSamples`
- Display-Models für Dialog

**Tests**: `tests/unitTests/missingSamples.spec.ts`

**Aufwand**: 10-12 Stunden

---

#### 3.2 Autoload-Funktion
**Dateien**: `stores/browser.ts`, `stores/control.ts`

**Änderungen**:
- State: `autoloadEnabled: boolean`
- localStorage Key: `drumcomputer_autoload_v1`
- Bei `selectResult()` oder `selectPath()`:
  - Wenn `autoloadEnabled === true`: automatisch `importSelected()` aufrufen
- Soft-Button-Verdrahtung (falls vorhanden)

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 2-3 Stunden

---

#### 3.3 Info-Button (Datei-Informationen)
**Dateien**: `stores/browser.ts`, neue Komponente (optional)

**Änderungen**:
- State: `infoDialogOpen: boolean`, `infoDialogItemId: string | null`
- Actions:
  - `openInfoDialog(itemId: string)`
  - `closeInfoDialog()`
- Datei-Informationen aus LibraryItem + FileSystem:
  - Name, Path, Size, Format, Tags, Category, Product, Bank
  - Optional: Sample-Rate, Bit-Depth (benötigt Audio-Analyse)
- Display-Models für Info-Dialog

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 6-8 Stunden

---

#### 3.4 EDIT-Button (Attribut-Editor / Bulk-Editing)
**Dateien**: `stores/browser.ts`, neue Komponente

**Änderungen**:
- State: `editDialogOpen: boolean`, `editDialogItemIds: string[]`
- Actions:
  - `openEditDialog(itemIds: string[])`
  - `closeEditDialog()`
  - `bulkAddTag(tag: string)`
  - `bulkRemoveTag(tag: string)`
  - `bulkSetCategory(category: string)`
  - etc.
- Display-Models für Bulk-Edit-Dialog
- Multi-Selection im Browser

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 10-12 Stunden

---

#### 3.5 Load Patterns Checkbox (Group-Import)
**Dateien**: `stores/browser.ts`, Group-Load-Logik

**Änderungen**:
- State: `loadPatternsWithGroup: boolean`
- localStorage Key: `drumcomputer_load_patterns_v1`
- Bei Group-Import:
  - Wenn `loadPatternsWithGroup === true`: Patterns mitladen
- Integration in importSelected() für fileType === 'kit' | 'group'

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 3-4 Stunden

---

#### 3.6 Preferences-Integration (Library-Pfade)
**Dateien**: Neuer Store `stores/preferences.ts` oder erweitern bestehender

**Änderungen**:
- State: `libraryPaths: string[]`
- localStorage Key: `drumcomputer_library_paths_v1`
- Actions:
  - `addLibraryPath(path: string)`
  - `removeLibraryPath(path: string)`
  - `getLibraryPaths(): string[]`
- Bei importDirectory(): Pfad automatisch zu libraryPaths hinzufügen

**Tests**: `tests/unitTests/preferences.spec.ts`

**Aufwand**: 4-6 Stunden

---

#### 3.7 FILES-Bereich: Refresh & Find in Explorer
**Dateien**: `stores/browser.ts`, `services/fileSystemRepository.ts`

**Änderungen**:
- Refresh:
  - Action: `refreshFileList()` → ruft `listDir(currentPath)` erneut auf
  - Soft-Button-Verdrahtung
- Find in Explorer/Finder:
  - Browser-API-Limitation: Nicht möglich im Browser
  - Alternative: Copy Path to Clipboard
  - Action: `copyPathToClipboard(path: string)`

**Tests**: `tests/unitTests/browserStore.spec.ts` erweitern

**Aufwand**: 2-3 Stunden

---

### Phase 4: Performance & Polish (Optional)

#### 4.1 Virtual Scrolling für Ergebnisliste (>100 Items)
**Dateien**: `components/control/DualDisplay.vue`

**Änderungen**:
- Bereits implementiert: Windowing in `toDisplayModels()` (max 100 Items)
- Optional: Echtes Virtual Scrolling mit vue-virtual-scroller
- Performance-Tests mit 10.000+ Items

**Aufwand**: 6-8 Stunden

---

#### 4.2 Lazy-Loading für Thumbnails/Waveforms
**Dateien**: Neue Services für Waveform-Generierung

**Änderungen**:
- Waveform-Generierung für Samples
- Thumbnail-Cache in IndexedDB
- Lazy-Loading-Strategie
- Display-Integration

**Aufwand**: 12-16 Stunden

---

#### 4.3 IndexedDB für große Libraries (>1000 Items)
**Status**: Bereits implementiert (siehe `services/sampleDb.ts`)

**Vorhanden**:
- Migration von localStorage zu IndexedDB
- Threshold: 50 Items (DB_SEARCH_THRESHOLD)
- Fallback bei Fehler

**Verbesserungen**:
- Threshold anpassen (50 → 1000)?
- Weitere Optimierungen

**Aufwand**: 2-4 Stunden

---

## Zusammenfassung: Funktionalitäts-Matrix

| Feature | Manual | Implementiert | Status | Priority |
|---------|--------|---------------|--------|----------|
| **Kern-Features** |
| LIBRARY/FILES Modi | ✓ | ✓ | ✅ Vollständig | - |
| Query-Suche | ✓ | ✓ | ✅ Vollständig | - |
| Erweiterte Filter | ✓ | ✓ | ✅ Vollständig | - |
| Sortierung | ✓ | ✓ | ✅ Vollständig | - |
| Dual-Display | ✓ | ✓ | ✅ Vollständig | - |
| **4D-Encoder** |
| Encoder-Logik | ✓ | ✓ | ✅ Vollständig | - |
| Control-Store Verdrahtung | ✓ | ⚠️ | ⚠️ Teilweise | 🔴 High |
| Display-Highlight (Klammern) | ✓ | ❌ | ⚠️ Fehlt UI | 🟡 Medium |
| **Import/Export** |
| Einzeldatei-Import | ✓ | ✓ | ✅ Vollständig | - |
| Ordner-Import | ✓ | ❌ | ⚠️ Fehlt | 🔴 High |
| Import mit Progress | ✓ | ❌ | ⚠️ Fehlt | 🔴 High |
| Attribut-Editor beim Import | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Metadaten-Extraktion | ✓ | ✓ | ✅ Vollständig | - |
| **File System** |
| Memory-FS | - | ✓ | ✅ Vollständig | - |
| File System Access API | ✓ (Web) | ❌ | ⚠️ Fehlt | 🔴 High |
| **Favorites** |
| Library-Item Favorites | ✓ | ✓ | ✅ Vollständig | - |
| Ordner-Favorites | ✓ | ❌ | ❌ Fehlt | 🟡 Medium |
| **Recent Files** |
| Recent-Tracking | ✓ | ✓ | ✅ Vollständig | - |
| Recent-Page | ✓ | ✓ | ✅ Vollständig | - |
| **Quick-Browse** |
| History-Tracking | ✓ | ✓ | ✅ Vollständig | - |
| Kontext-basiert | ✓ | ✓ | ✅ Vollständig | - |
| Restore-Funktion | ✓ | ✓ | ✅ Vollständig | - |
| **Preview** |
| Sample-Preview | ✓ | ✓ | ✅ Vollständig | - |
| Play/Stop/Pause | ✓ | ✓ | ✅ Vollständig | - |
| **Tags** |
| Tag-Verwaltung | ✓ | ✓ | ✅ Vollständig | - |
| Tag-Dialog | ✓ | ✓ | ⚠️ Teilweise | 🟡 Medium |
| Bulk-Tag-Editor | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| **Hierarchie** |
| Category/Product/Bank/Sub-Bank | ✓ | ✓ | ✅ Vollständig | - |
| Hierarchie-Filter | ✓ | ✓ | ✅ Vollständig | - |
| **Missing Samples** |
| Detection | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Dialog | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| IGNORE/LOCATE | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Purge/Find | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| **UI-Features** |
| Autoload | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Load Patterns Checkbox | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Info-Button | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| EDIT-Button | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Refresh-Button | ✓ | ❌ | ❌ Fehlt | 🟢 Low |
| Find in Explorer | ✓ | ❌ | ❌ Nicht möglich (Browser) | - |
| **Preferences** |
| Library-Pfade-Verwaltung | ✓ | ❌ | ❌ Fehlt | 🟢 Low |

---

## Empfohlene Umsetzungs-Reihenfolge

### Sprint 1: Kritische Lücken (2-3 Wochen)
1. ✅ Control-Store 4D-Encoder-Integration (4-6h)
2. ✅ File System Access API (8-12h)
3. ✅ Import-Directory mit Progress (6-8h)

**Ziel**: Browser vollständig bedienbar mit 4D-Encoder, echtes Dateisystem zugänglich

---

### Sprint 2: UI/UX-Verbesserungen (1-2 Wochen)
4. ✅ Display-Highlight für aktives Feld (2-4h)
5. ✅ Tag-Dialog Encoder-Navigation (4-6h)
6. ✅ FILES-Bereich: Ordner-Favoriten (3-4h)
7. ✅ Sortierung UI-Verdrahtung (1-2h)

**Ziel**: Workflows identisch mit Manual, intuitive Bedienung

---

### Sprint 3: Erweiterte Features (2-3 Wochen, Optional)
8. ⚠️ Missing Samples Dialog (10-12h)
9. ⚠️ Autoload-Funktion (2-3h)
10. ⚠️ Info-Button (6-8h)
11. ⚠️ EDIT-Button / Bulk-Editing (10-12h)
12. ⚠️ Load Patterns Checkbox (3-4h)
13. ⚠️ Preferences-Integration (4-6h)
14. ⚠️ FILES-Bereich: Refresh & Copy Path (2-3h)

**Ziel**: Feature-Parität mit Manual

---

### Sprint 4: Performance & Polish (1-2 Wochen, Optional)
15. ⚠️ Virtual Scrolling (6-8h)
16. ⚠️ Lazy-Loading Thumbnails/Waveforms (12-16h)
17. ⚠️ IndexedDB-Optimierungen (2-4h)

**Ziel**: Skalierbarkeit für große Libraries

---

## Offene Fragen & Entscheidungen

### 1. Sollte File System Access API als Feature-Flag implementiert werden?
- **Pro**: Schrittweise Einführung, Fallback immer verfügbar, einfacher Testing
- **Con**: Mehr Code-Komplexität, doppelte Maintenance
- **Empfehlung**: Ja, als Feature-Flag mit klarem Fallback-Pfad

### 2. Sollten Favorites/Recent/Tags in IndexedDB statt localStorage?
- **Pro**: Bessere Performance bei vielen Items (>1000), strukturierte Queries
- **Con**: Mehr Setup-Code, Browser-Kompatibilität
- **Empfehlung**: localStorage für Metadata (Favorites, Recent), IndexedDB für große Sammlungen (Library Items)

### 3. Sollte Preview-Audio separater AudioContext sein?
- **Pro**: Unabhängig von Main-Engine, keine Störungen
- **Con**: Mehr Ressourcen, mögliche Permission-Issues
- **Empfehlung**: Nein, bestehenden AudioContext nutzen (wie derzeit)

### 4. Wie tief sollte die Hierarchie gehen?
- **Manual**: Category → Product → Bank → Sub-Bank (4 Ebenen)
- **Implementierung**: Vollständig vorhanden
- **Empfehlung**: Beibehalten, funktioniert gut

### 5. Missing Samples Dialog: Priorität?
- **Pro**: Wichtig für Pattern/Project-Import
- **Con**: Edge-Case, aufwändig
- **Empfehlung**: Low Priority, erst nach Core-Features

### 6. Bulk-Editing (EDIT-Button): Notwendig?
- **Pro**: Effizienter für viele Dateien
- **Con**: UI-komplex
- **Empfehlung**: Low Priority, Single-Item-Editing reicht erstmal

### 7. Controller-spezifische Features: Umsetzen?
- **Hinweis**: Projekt fokussiert auf Web-UI
- **Empfehlung**: Nicht umsetzen, außer klar definierte MIDI-Controller-Integration

---

## Fazit

### Implementierungs-Vollständigkeit: **~75%**

**Vollständig (✅)**: 
- Kern-Browser-Funktionalität
- 4D-Encoder-Logik
- Recent Files
- Quick-Browse
- Sample Preview
- Favorites (Items)
- Tags
- Hierarchie-Filter
- Sortierung
- Dual-Display

**Teilweise (⚠️)**:
- Control-Store 4D-Verdrahtung
- File System Access API
- Import-Directory
- Tag-Dialog UI

**Fehlt (❌)**:
- Missing Samples Dialog
- Ordner-Favoriten
- Autoload
- Info-Button
- EDIT-Button (Bulk-Editing)
- Load Patterns Checkbox
- Preferences-Integration
- FILES-Bereich Kontext-Menü (teilweise)

### Workflow-Identität: **~80%**

Die meisten User-Workflows sind identisch mit dem Manual. Die Hauptabweichungen betreffen:
1. Ordner-Import (einzelne Dateien statt Ordner)
2. Fehlende Samples (nicht implementiert)
3. Ordner-Favoriten (nicht implementiert)
4. 4D-Encoder Control-Store-Verdrahtung (teilweise)

### Empfehlung: Sprint 1 + Sprint 2 priorisieren

Mit Sprint 1 (Control-Store + File System Access + Import-Directory) und Sprint 2 (UI-Verbesserungen) erreichen wir **~90% Workflow-Identität** und eine vollständig bedienbare Browser-Funktionalität.

Sprint 3 und 4 sind optional und können basierend auf User-Feedback priorisiert werden.
