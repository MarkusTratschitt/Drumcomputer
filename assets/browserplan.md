# Browser-Implementierungsplan für Drumcomputer

## Überblick

Basierend auf dem MASCHINE MK3 Manual (Seiten 173-238) und der bestehenden Codebasis wird dieser Plan die fehlenden Browser-Funktionen definieren, die implementiert werden müssen, damit der Browser vollständig funktioniert wie auf der Hardware.

**Ziel:** Lokales Dateisystem durchsuchbar machen, 4-D-Encoder-Navigation implementieren, und alle Browser-Features aus dem Manual umsetzen.

**Harte Constraints:**
- Keine UI-Änderungen (keine Pug-Templates, Vuetify-Komponenten, CSS, Buttons)
- Nur Logik: Stores, Services, Composables, Methoden, Events
- DrumMachine bleibt zentral für Mode-Switching, Import, Auswahl, Preview/Load-Flow
- Minimal-invasive Änderungen
- Tests müssen grün bleiben

## Bestehende Implementierung

### Bereits vorhanden:
- **Store:** `stores/browser.ts` mit Modes (LIBRARY, FILES), Query, Results, File-Listing
- **Store:** `stores/control.ts` mit Browser-Pages, Soft-Buttons, Encoder-Params, Display-Models
- **Services:** 
  - `services/fileSystemRepository.ts` - Memory-basiertes Dateisystem (Stub)
  - `services/libraryRepository.ts` - LocalStorage-basierte Library mit Tags, Search, Import
- **Types:** `types/library.ts` - BrowserMode, BrowserResultItem, BrowserFileEntry
- **Components:**
  - `components/control/DualDisplay.vue` - Zeigt Browser/File-Views in beiden Displays
  - `components/control/SoftButtonStrip.vue` - 8 Soft-Buttons
  - `components/placeholders/FourDEncoderPlaceholder.vue` - Placeholder für 4D-Encoder
  - `components/SampleBrowser.vue` - Minimaler Stub

### Integration:
- `DrumMachine.vue` bindet Control-Store, zeigt DualDisplay und SoftButtonStrip
- Control-Store hat `applyAction()` für BROWSER_LOAD, BROWSER_SEARCH, BROWSER_CLEAR, etc.
- Browser-Store hat `toDisplayModels()` für Display-Darstellung
- Control-Store nutzt `setBrowserDisplay()` um Browser-Models zu übernehmen

## Browser-Funktionen aus Manual (Seiten 173-238)

### 1. Dual-Display-Organisation (Seite 179)

**Linkes Display:** Suche eingrenzen durch:
- Dateityp-Filter (Type)
- Inhalte-Typ (Factory vs User)
- Produkt-Kategorie
- Produkt
- Bank
- Sub-Bank

**Rechtes Display:** Suche verfeinern durch:
- Type-Auswahl
- Character-Auswahl
- Ergebnisliste mit Details
- Drehen des 4-D-Encoders zum Navigieren
- Drücken des 4-D-Encoders oder Button 8 (LOAD) zum Laden

### 2. 4-D-Encoder-Navigation (Seite 180)

Der 4-D-Encoder ermöglicht:
- **Links/Rechts bewegen:** Feld-Auswahl (zwischen Filtern wechseln)
- **Drehen:** Wert im ausgewählten Feld ändern
- **Nach rechts bewegen:** Zur Ergebnisliste wechseln
- **Drehen in Ergebnisliste:** Element auswählen
- **Drücken:** Auswahl laden

Dünne Klammern zeigen das ausgewählte Feld an.

### 3. Produkt-Wähler (Seite 180)

Funktion zum Eingrenzen auf:
- Produkt-Kategorie
- Bestimmtes Produkt
- Spezifische Bank des Produkts
- Direktes Laden von Produkt mit Preset-Datei

### 4. FILES-Bereich (Seite 230-232)

Kontext-Menü-Befehle:
- **Add to Favorites:** Ordner zu Favoriten hinzufügen
- **Import to Library:** Ordner in Library importieren
- **Refresh:** Liste neu einlesen
- **Find in Explorer/Finder:** Ordner im OS öffnen (nicht im Browser möglich)
- **Sort by Name:** Nach Namen sortieren
- **Sort by Date:** Nach Datum sortieren

### 5. Library-Import (Seiten 231-232)

Workflow:
1. Ordner im FILES-Bereich auswählen
2. "Import to Library" auswählen
3. Dateien werden als User-Content in Library aufgenommen
4. Pfade in Preferences gespeichert
5. Dateien bleiben am ursprünglichen Ort (nur Referenz)

### 6. Missing Samples (Seiten 233-234)

Dialog zum Auffinden fehlender Samples:
- IGNORE: Sample ignorieren
- IGNORE ALL: Alle ignorieren
- Später: "Purge Missing Samples" oder "Find Missing Samples" im Kontext-Menü

### 7. Quick-Browse (Seiten 235-238)

Schnelles Wiederaufrufen einer vorherigen Suchanfrage:
- Für Instrumenten-/Effekt-Presets
- Für Samples
- Im Control-Modus: Button drücken → Quick-Browse öffnet sich mit letzter Suche
- Im Browse-Modus: Zugriff auf Groups und Sounds

### 8. Soft-Button-Funktionen (aus control.ts, Seite 130-140)

Browser-Page hat bereits:
- **Search** / SHIFT: Plug-In Menu
- **Type:** Dateityp filtern
- **Tag:** Tags filtern
- **Favorites:** Favoriten anzeigen
- **Prehear** / SHIFT: Stop - Sample vorhören
- **Load:** Auswahl laden
- **Replace:** Auswahl ersetzen
- **Clear:** Auswahl löschen

Recent-Page:
- **Recent:** Letzte Dateien
- **Clear Recent**
- **Fav:** Als Favorit markieren
- **Tag:** Tag hinzufügen
- **Load Recent**
- **Prehear**
- **Replace**
- **Stop**

## Fehlende Implementierungen

### A. File System Access API Integration

**Problem:** `fileSystemRepository.ts` ist derzeit nur ein Memory-Stub.

**Lösung:** Neue Implementierung mit Browser File System Access API (wo verfügbar):

```typescript
// services/fileSystemRepository.ts - Neue Klasse
class BrowserFileSystemRepository implements FileSystemRepository {
  private rootHandle: FileSystemDirectoryHandle | null = null
  
  async requestAccess(): Promise<boolean>
  async listDir(path: string): Promise<DirectoryListing>
  async stat(path: string): Promise<{ isDir: boolean }>
  async readFileMeta(path: string): Promise<{ name: string; extension?: string }>
  async readFileBlob(path: string): Promise<Blob>
}
```

**Fallback:** Wenn File System Access API nicht verfügbar:
- Weiter Memory-FS nutzen
- Oder File-Input-Dialog für Einzel-Uploads

### B. 4-D-Encoder-Logik

**Problem:** Placeholder-Komponente existiert, aber keine Navigation-Logik.

**Lösung:** Neue Composable `composables/use4DEncoder.ts`:

```typescript
type EncoderAxis = 'vertical' | 'horizontal'
type EncoderMode = 'field-select' | 'value-adjust' | 'list-navigate'

interface Encoder4DState {
  mode: EncoderMode
  currentAxis: EncoderAxis
  selectedFieldIndex: number
  selectedListIndex: number
  fields: EncoderField[]
}

interface EncoderField {
  id: string
  label: string
  value: string | number
  options?: string[]
}

function use4DEncoder() {
  const state = reactive<Encoder4DState>({ ... })
  
  function tiltHorizontal(direction: 'left' | 'right'): void
  function tiltVertical(direction: 'up' | 'down'): void  
  function turn(delta: number): void
  function press(): void
  
  function setFields(fields: EncoderField[]): void
  function getSelectedField(): EncoderField | null
  function getSelectedValue(): any
  
  return { state, tiltHorizontal, tiltVertical, turn, press, setFields, ... }
}
```

**Integration:**
- `stores/control.ts` nutzt `use4DEncoder()` für Browser/File-Modi
- Browser-Store liefert Felder (Type, Tag, Category, etc.)
- Encoder-State synchronisiert mit Display-Models

### C. Erweiterte Browser-Filter

**Problem:** Browser-Store hat nur einfache Query-Suche.

**Lösung:** Erweiterte Filter in `stores/browser.ts`:

```typescript
type BrowserFilters = {
  fileType?: 'sample' | 'kit' | 'pattern' | 'preset' | 'all'
  contentType?: 'factory' | 'user' | 'all'
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  tags?: string[]
  favorites?: boolean
}

// In useBrowserStore
state: {
  // ... existing
  filters: BrowserFilters
  availableCategories: string[]
  availableProducts: string[]
  availableBanks: string[]
}

actions: {
  setFilter(key: keyof BrowserFilters, value: any): void
  clearFilters(): void
  applyFilters(): void
  getAvailableOptions(filterKey: string): string[]
}
```

### D. Favorites-System

**Problem:** Favoriten-Funktion nicht implementiert.

**Lösung:** Erweiterung von `services/libraryRepository.ts`:

```typescript
interface LibraryRepository {
  // ... existing methods
  addToFavorites(itemId: string): Promise<void>
  removeFromFavorites(itemId: string): Promise<void>
  getFavorites(): Promise<LibraryItem[]>
  isFavorite(itemId: string): Promise<boolean>
}

// Persistence über localStorage
const FAVORITES_KEY = 'drumcomputer_favorites_v1'
```

**Integration:**
- Soft-Button "Favorites" filtert Ergebnisse
- Browser-Store Action `toggleFavorite(id: string)`
- Display zeigt Favoriten-Status (z.B. Stern-Symbol in Subtitle)

### E. Recent-Files-Tracking

**Problem:** Recent-Page existiert in Control-Store, aber keine Tracking-Logik.

**Lösung:** Neue Composable `composables/useRecentFiles.ts`:

```typescript
interface RecentFileEntry {
  id: string
  path: string
  name: string
  timestamp: number
  type: 'sample' | 'kit' | 'pattern' | 'preset'
}

function useRecentFiles() {
  const maxRecent = 50
  
  function addRecent(entry: Omit<RecentFileEntry, 'timestamp'>): void
  function getRecent(limit?: number): RecentFileEntry[]
  function clearRecent(): void
  function removeRecent(id: string): void
  
  return { addRecent, getRecent, clearRecent, removeRecent }
}
```

**Persistence:** localStorage mit Schlüssel `drumcomputer_recent_files_v1`

**Integration:**
- Browser-Store nutzt `useRecentFiles()` für Recent-Mode
- Bei jedem `importSelected()` → `addRecent()`
- Control-Store Recent-Page zeigt `getRecent()`

### F. Prehear/Preview-Funktion

**Problem:** Prehear-Button existiert, aber keine Audio-Preview.

**Lösung:** Neue Composable `composables/useSamplePreview.client.ts`:

```typescript
interface PreviewState {
  isPlaying: boolean
  currentFile: string | null
  progress: number // 0-1
  duration: number
}

function useSamplePreview() {
  const audioContext = inject<AudioContext>('audioContext')
  const state = reactive<PreviewState>({ ... })
  
  async function loadAndPlay(path: string, blob?: Blob): Promise<void>
  function stop(): void
  function pause(): void
  function resume(): void
  function seek(position: number): void
  
  return { state, loadAndPlay, stop, pause, resume, seek }
}
```

**Integration:**
- Browser-Store Action `prehearSelected()`
- Control-Store `applyAction('BROWSER_PREHEAR')` → `browser.prehearSelected()`
- Preview-Parameter in Encoder-Slots (Start, End, Tune, etc.)

### G. Quick-Browse-System

**Problem:** Quick-Browse nicht implementiert.

**Lösung:** Neue Composable `composables/useQuickBrowse.ts`:

```typescript
interface BrowseHistoryEntry {
  timestamp: number
  mode: BrowserMode
  query: string
  filters: BrowserFilters
  selectedId: string | null
  contextType: 'sample' | 'preset' | 'group' | 'sound'
  contextId: string // Pad-ID, Slot-ID, etc.
}

function useQuickBrowse() {
  const history: BrowseHistoryEntry[] = reactive([])
  
  function recordBrowse(entry: Omit<BrowseHistoryEntry, 'timestamp'>): void
  function getLastBrowse(contextId: string): BrowseHistoryEntry | null
  function restoreBrowse(entry: BrowseHistoryEntry): void
  function clearHistory(): void
  
  return { history, recordBrowse, getLastBrowse, restoreBrowse, clearHistory }
}
```

**Integration:**
- Bei `importSelected()` → `recordBrowse()` mit Kontext
- Soft-Button oder Keyboard-Shortcut öffnet Quick-Browse
- Browser-Store lädt letzte Suche via `restoreBrowse()`

### H. Sortierung und Anzeige-Optionen

**Problem:** Keine Sortierung implementiert.

**Lösung:** Erweiterung von `stores/browser.ts`:

```typescript
type SortMode = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'relevance'

// In state
sortMode: SortMode

// Actions
setSortMode(mode: SortMode): void
sortResults(): void
```

**Integration:**
- File-Mode: Kontext-Menü-Simulation über Soft-Button
- Encoder-Parameter für Sort-Mode

### I. Import-Workflow mit Fortschritt

**Problem:** Import geschieht sofort ohne Feedback.

**Lösung:** Erweiterung von `services/libraryRepository.ts`:

```typescript
interface ImportProgress {
  total: number
  completed: number
  current: string
  errors: string[]
}

interface LibraryRepository {
  // ... existing
  importDirectory(
    path: string, 
    options?: { recursive?: boolean },
    onProgress?: (progress: ImportProgress) => void
  ): Promise<void>
}
```

**Integration:**
- Browser-Store Action `importDirectory(path, onProgress)`
- Display zeigt Fortschritt (optional über status-Panel)

### J. Tag-Management

**Problem:** Tags existieren, aber kein UI-Flow.

**Lösung:** Erweiterung von `stores/browser.ts`:

```typescript
// Actions
async showTagDialog(itemId: string): Promise<void>
async addTagToSelected(tag: string): Promise<void>
async removeTagFromSelected(tag: string): Promise<void>
getAvailableTags(): string[]
```

**Integration:**
- Soft-Button "Tag" öffnet Tag-Dialog (als Display-Overlay)
- Encoder navigiert durch existierende Tags
- Encoder + Press fügt neues Tag hinzu

### K. Category/Product/Bank-Hierarchie

**Problem:** Library hat flache Struktur.

**Lösung:** Erweiterte Metadaten in `services/libraryRepository.ts`:

```typescript
interface LibraryItem {
  // ... existing
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  vendor?: 'factory' | 'user'
}

interface LibraryRepository {
  // ... existing
  getCategories(): Promise<string[]>
  getProducts(category?: string): Promise<string[]>
  getBanks(product?: string): Promise<string[]>
  getSubBanks(bank?: string): Promise<string[]>
}
```

**Import-Pipeline:**
- Beim Import Metadaten aus Dateinamen/Pfaden extrahieren
- Schema: `/Category/Product/Bank/SubBank/filename.wav`
- Fallback: User-definierte Kategorien

## Implementierungs-Reihenfolge (Priorität)

### Phase 1: Kern-Navigation (Höchste Priorität)
1. **4-D-Encoder-Composable** (`composables/use4DEncoder.ts`)
   - State-Management für Encoder-Modi
   - Tilt/Turn/Press-Logik
   - Feld-Navigation und Wert-Änderung

2. **Browser-Filter-Erweiterung** (`stores/browser.ts`)
   - BrowserFilters-Type
   - setFilter/clearFilters/applyFilters Actions
   - Integration mit 4D-Encoder

3. **Control-Store 4D-Integration** (`stores/control.ts`)
   - use4DEncoder() einbinden für Browser-Mode
   - Encoder-Events auf Browser-Actions mappen
   - Display-Update bei Feld-Wechsel

### Phase 2: File System & Import
4. **File System Access API** (`services/fileSystemRepository.ts`)
   - BrowserFileSystemRepository-Klasse
   - requestAccess() für User-Permission
   - Directory-Listing mit echter FS-API
   - Fallback-Strategie

5. **Import-Workflow** (`services/libraryRepository.ts`)
   - importDirectory() mit Progress
   - Metadaten-Extraktion (Category/Product/Bank)
   - Fehlerbehandlung

6. **Recent Files Tracking** (`composables/useRecentFiles.ts`)
   - localStorage-basiertes Tracking
   - Integration in Browser-Store
   - Recent-Page-Anbindung

### Phase 3: Features
7. **Favorites-System** (`services/libraryRepository.ts`)
   - addToFavorites/removeFromFavorites
   - localStorage-Persistence
   - Filter-Integration

8. **Prehear/Preview** (`composables/useSamplePreview.client.ts`)
   - Audio-Preview mit Web Audio
   - Play/Stop/Seek
   - Encoder-Parameter (Start, End, Tune)

9. **Sortierung** (`stores/browser.ts`)
   - SortMode-State
   - sortResults() Action
   - Display-Integration

### Phase 4: Advanced Features
10. **Quick-Browse** (`composables/useQuickBrowse.ts`)
    - History-Tracking
    - Context-basierte Wiederherstellung
    - Soft-Button-Integration

11. **Tag-Management-UI-Flow** (`stores/browser.ts`)
    - Tag-Dialog als Display-Overlay
    - Encoder-Navigation durch Tags
    - Add/Remove Actions

12. **Category/Product/Bank-Hierarchie**
    - Erweiterte Metadaten
    - Hierarchische Filter
    - Encoder-Navigation durch Hierarchie

## Integration-Punkte mit DrumMachine

### Mode-Switching
```typescript
// DrumMachine.vue bereits vorhanden
handleModePress(mode: string, shiftMode?: string) {
  const control = useControlStore()
  control.setMode(this.shiftHeld && shiftMode ? shiftMode : mode)
  
  // Neu: Bei Browser-Mode
  if (mode === 'BROWSER' || mode === 'FILE') {
    const browser = useBrowserStore()
    const encoder4D = use4DEncoder()
    
    // Browser-Display aktualisieren
    control.setBrowserDisplay(browser.toDisplayModels())
    
    // 4D-Encoder-Felder setzen
    encoder4D.setFields(browser.getEncoderFields())
  }
}
```

### Import/Load-Flow
```typescript
// Browser-Store Action (erweitert)
async importSelected() {
  if (!this.files.selectedPath && !this.library.selectedId) return
  
  const repo = getLibraryRepository()
  const recent = useRecentFiles()
  
  if (this.mode === 'FILES' && this.files.selectedPath) {
    const item = await repo.importFile(this.files.selectedPath)
    recent.addRecent({ id: item.id, path: item.path, name: item.name, type: 'sample' })
  }
  
  // QuickBrowse aufzeichnen
  const quickBrowse = useQuickBrowse()
  quickBrowse.recordBrowse({
    mode: this.mode,
    query: this.library.query,
    filters: this.filters,
    selectedId: this.library.selectedId,
    contextType: 'sample',
    contextId: getCurrentPadId() // Von DrumMachine
  })
  
  await this.search()
  
  // Event an DrumMachine (falls Sample geladen werden soll)
  emit('sample-imported', item)
}
```

### Preview/Prehear
```typescript
// Browser-Store Action (neu)
async prehearSelected() {
  const preview = useSamplePreview()
  const path = this.files.selectedPath || this.getSelectedItemPath()
  
  if (!path) return
  
  // Load & Play
  await preview.loadAndPlay(path)
  
  // Encoder zeigt Preview-Parameter
  this.previewMode = true
}
```

## Event-Flow-Diagramm

```
User interagiert mit 4D-Encoder (tilt/turn/press)
    ↓
use4DEncoder() verarbeitet Input
    ↓
Browser-Store aktualisiert Filter/Selection
    ↓
Browser-Store ruft toDisplayModels() auf
    ↓
Control-Store.setBrowserDisplay(models)
    ↓
DualDisplay rendert aktualisierte Panels
    ↓
User drückt LOAD-Button (Soft-Button 6)
    ↓
Control-Store.pressSoftButton(5) → applyAction('BROWSER_LOAD')
    ↓
Browser-Store.importSelected()
    ↓
LibraryRepository.importFile() + useRecentFiles.addRecent()
    ↓
DrumMachine erhält 'sample-imported' Event
    ↓
DrumMachine lädt Sample in aktiven Pad
```

## Testing-Strategie

### Unit Tests
- `tests/unitTests/use4DEncoder.spec.ts` - Encoder-Logik
- `tests/unitTests/browserFilters.spec.ts` - Filter-Funktionen
- `tests/unitTests/recentFiles.spec.ts` - Recent-Tracking
- `tests/unitTests/favorites.spec.ts` - Favorites-System
- `tests/unitTests/quickBrowse.spec.ts` - Quick-Browse-History
- `tests/unitTests/samplePreview.spec.ts` - Preview-Funktionalität

### Integration Tests
- `tests/unitTests/controlBrowserIntegration.spec.ts` (bereits vorhanden, erweitern)
  - 4D-Encoder → Browser-Store
  - Soft-Button → Import
  - Preview → Audio-Engine

### Component Tests
- `tests/componentTests/DualDisplay.component.spec.ts` (neu)
  - Browser-View Rendering
  - File-View Rendering
  - Display-Model-Updates

## Performance-Überlegungen

### Lazy Loading
- Verzeichnislisten nur bei Bedarf laden
- Thumbnails/Waveforms asynchron nachladen
- Search-Debouncing (300ms)

### Caching
- Category/Product/Bank-Listen cachen
- Recent Files in Memory halten
- Favorites-Set als lokale Kopie

### Optimierung
- Virtuelle Listen für große Ergebnismengen (>100 Items)
- Web Workers für File-Scanning (wo möglich)
- IndexedDB für große Libraries (>1000 Items)

## Fehlerbehandlung

### File System Access
- Permission denied → Fallback auf Memory-FS oder File-Input
- Invalid path → Error in Display
- Missing files → "Missing Samples" Dialog (bereits im Manual)

### Import
- Unsupported format → Skip mit Warning
- Duplicate → Merge oder Skip (User-Option)
- Disk full → Error-Dialog

### Preview
- Load error → Toast-Notification
- Unsupported format → Fallback auf Info-Display
- Playback error → Stop & Clear

## Accessibility

### Keyboard-Navigation
- Tab durch Filter-Felder
- Arrow-Keys für Listen-Navigation
- Enter für Auswahl/Laden
- Escape für Abbrechen

### Screen-Reader
- Aria-Labels für alle Filter
- Aria-Live für Ergebnisanzahl
- Aria-Selected für aktives Element

### Fokus-Management
- Fokus bleibt auf aktivem Feld
- Nach Import → Fokus auf Ergebnisliste
- Nach Clear → Fokus auf Search-Field

## Dokumentation

### Für Entwickler
- JSDoc für alle neuen Composables
- Inline-Kommentare für komplexe Logik
- README-Update mit Browser-Workflow

### Für User
- Tooltip-Hints im Display
- Keyboard-Shortcuts-Übersicht
- Quick-Start-Guide (optional)

## Offene Fragen

1. **Sollte BrowserFileSystemRepository als Feature-Flag implementiert werden?**
   - Pro: Schrittweise Einführung, Fallback immer verfügbar
   - Con: Mehr Code-Komplexität

2. **Sollten Favorites/Recent/Tags in IndexedDB statt localStorage?**
   - Pro: Bessere Performance bei vielen Items, strukturierte Queries
   - Con: Mehr Setup-Code, Browser-Kompatibilität

3. **Sollte Preview-Audio separater AudioContext sein?**
   - Pro: Unabhängig von Main-Engine, keine Störungen
   - Con: Mehr Ressourcen, mögliche Permission-Issues

4. **Wie tief sollte die Hierarchie gehen? (Category → Product → Bank → SubBank)**
   - Aktuell: 4 Ebenen wie im Manual
   - Alternative: Flache Tags mit Prefixes

## Abschluss

Dieser Plan deckt alle Browser-Funktionen aus dem MASCHINE MK3 Manual (Seiten 173-238) ab und definiert eine schrittweise Implementierung ohne UI-Änderungen. Die Logik wird in Stores, Services und Composables gekapselt und über die bestehende DrumMachine-Komponente koordiniert.

**Nächster Schritt:** Review dieses Plans mit dem Team, dann Phase 1 starten.
