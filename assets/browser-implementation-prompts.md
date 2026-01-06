# Browser Implementation Prompts

Diese Datei enthält detaillierte Prompts für die schrittweise Implementierung der Browser-Funktionalität gemäß `browserplan.md`. Jeder Prompt ist so gestaltet, dass ein Agent ihn ausführen kann.

---

## Phase 1: Kern-Navigation

### Prompt 1.1: 4-D-Encoder Composable

**Aufgabe:** Implementiere `composables/use4DEncoder.ts` für die 4-D-Encoder-Navigation.

**Anforderungen:**
1. Erstelle die Datei `composables/use4DEncoder.ts`
2. Implementiere eine State-Machine mit drei Modi:
   - `field-select`: Encoder navigiert zwischen Filter-Feldern
   - `value-adjust`: Encoder ändert Wert im aktuellen Feld
   - `list-navigate`: Encoder navigiert durch Ergebnisliste
3. Unterstütze folgende Aktionen:
   - `tiltHorizontal(direction: 'left' | 'right')`: Wechselt zwischen Feldern
   - `tiltVertical(direction: 'up' | 'down')`: Navigiert in Listen
   - `turn(delta: number)`: Ändert Werte (im value-adjust Modus) oder scrollt (im list-navigate Modus)
   - `press()`: Bestätigt Auswahl oder wechselt in nächsten Modus
4. Verwalte eine Liste von `EncoderField[]` mit:
   ```typescript
   interface EncoderField {
     id: string
     label: string
     value: string | number
     options?: string[]  // Für Drop-down-Felder
     min?: number        // Für numerische Felder
     max?: number
     step?: number
   }
   ```
5. Exportiere reactive State und Methoden
6. Schreibe Unit-Tests in `tests/unitTests/use4DEncoder.spec.ts`:
   - Testen der Feld-Navigation
   - Testen der Wert-Änderung
   - Testen der Modi-Wechsel
   - Testen der Press-Aktion

**Constraints:**
- TypeScript strict mode
- Vue 3 Composition API (reactive, computed)
- Keine UI-Komponenten
- Kompatibel mit Nuxt 4

**Erfolg:** Tests laufen grün, Composable ist einsatzbereit für Browser-Store-Integration.

---

### Prompt 1.2: Browser-Filter-Erweiterung

**Aufgabe:** Erweitere `stores/browser.ts` um erweiterte Filter-Funktionalität.

**Anforderungen:**
1. Öffne `stores/browser.ts`
2. Definiere neuen Type `BrowserFilters` (siehe browserplan.md, Abschnitt C)
3. Füge zum State hinzu:
   ```typescript
   filters: BrowserFilters
   availableCategories: string[]
   availableProducts: string[]
   availableBanks: string[]
   ```
4. Implementiere Actions:
   - `setFilter(key: keyof BrowserFilters, value: any)`: Setzt einzelnen Filter
   - `clearFilters()`: Setzt alle Filter zurück
   - `applyFilters()`: Wendet Filter auf Suchergebnisse an
   - `getAvailableOptions(filterKey: string)`: Gibt verfügbare Optionen für Filter zurück
   - `getEncoderFields()`: Konvertiert aktuelle Filter zu EncoderField[] für 4D-Encoder
5. Erweitere `search()` Action um Filter-Anwendung
6. Aktualisiere `toDisplayModels()` um aktive Filter anzuzeigen
7. Erweitere bestehende Tests in `tests/unitTests/browserStore.spec.ts`:
   - Testen der Filter-Anwendung
   - Testen der Filter-Kombination (z.B. fileType + category)
   - Testen von getEncoderFields()

**Integration:**
- `getEncoderFields()` sollte Felder in dieser Reihenfolge zurückgeben:
  1. fileType (Type)
  2. contentType (Factory/User)
  3. category
  4. product
  5. bank
  6. tags (komma-separiert)
  7. favorites (boolean)

**Constraints:**
- Keine Breaking Changes an bestehenden Methods
- Backward-kompatibel mit existierendem Code
- Bestehende Tests müssen weiterhin grün bleiben

**Erfolg:** Erweiterte Filter funktionieren, getEncoderFields() liefert korrekte Daten, alle Tests grün.

---

### Prompt 1.3: Control-Store 4D-Integration

**Aufgabe:** Integriere `use4DEncoder()` in `stores/control.ts` für Browser-Modi.

**Anforderungen:**
1. Öffne `stores/control.ts`
2. Importiere `use4DEncoder` aus `composables/use4DEncoder.ts`
3. Füge zum State hinzu:
   ```typescript
   encoder4D: ReturnType<typeof use4DEncoder> | null
   ```
4. Erweitere `setMode()` Action:
   - Bei Wechsel zu BROWSER oder FILE Mode:
     - Initialisiere `encoder4D` falls noch nicht vorhanden
     - Hole Felder von Browser-Store via `browser.getEncoderFields()`
     - Setze Felder via `encoder4D.setFields(fields)`
5. Füge neue Actions hinzu:
   - `tiltEncoder4D(direction: 'left' | 'right' | 'up' | 'down')`: Leitet an encoder4D weiter
   - `turnEncoder4D(delta: number)`: Leitet an encoder4D weiter, aktualisiert Browser-Filter
   - `pressEncoder4D()`: Bestätigt Auswahl, lädt ggf. Item
6. Binde Encoder-Änderungen an Browser-Store:
   - Bei Feld-Wechsel: Update Display-Highlight
   - Bei Wert-Änderung: Rufe `browser.setFilter()` auf
   - Bei Press: Rufe `browser.importSelected()` auf (wenn in Liste)
7. Aktualisiere `toDisplayModels()` um markiertes Feld anzuzeigen (dünne Klammern)
8. Erweitere Tests in `tests/unitTests/controlBrowserIntegration.spec.ts`:
   - Testen der 4D-Encoder-Initialisierung
   - Testen der Feld-Navigation
   - Testen der Filter-Synchronisation
   - Testen der Load-Aktion via Press

**Constraints:**
- Encoder nur für BROWSER/FILE Modi aktiv
- Andere Modi (CHANNEL, PLUGIN, etc.) unverändert
- DrumMachine.vue bleibt unverändert

**Erfolg:** 4D-Encoder funktioniert im Browser-Mode, Filter werden korrekt gesetzt, Tests grün.

---

## Phase 2: File System & Import

### Prompt 2.1: File System Access API Wrapper

**Aufgabe:** Implementiere echte Browser File System Access API in `services/fileSystemRepository.ts`.

**Anforderungen:**
1. Öffne `services/fileSystemRepository.ts`
2. Erstelle neue Klasse `BrowserFileSystemRepository implements FileSystemRepository`
3. Implementiere Methoden:
   - `async requestAccess()`: Fordert User-Permission via `window.showDirectoryPicker()`
   - `async listDir(path: string)`: Listet Unterordner und Dateien
   - `async stat(path: string)`: Prüft ob Pfad existiert und ob es Dir ist
   - `async readFileMeta(path: string)`: Liest Name und Extension
   - `async readFileBlob(path: string)`: Neue Methode zum Blob-Laden
4. Speichere `FileSystemDirectoryHandle` in privater Variable
5. Implementiere Pfad-zu-Handle-Mapping (z.B. Map oder Cache)
6. Feature-Detection:
   ```typescript
   function hasFileSystemAccess(): boolean {
     return typeof window !== 'undefined' && 'showDirectoryPicker' in window
   }
   ```
7. Erweitere `getFileSystemRepository()`:
   - Wenn File System Access API verfügbar → BrowserFileSystemRepository
   - Sonst → existierendes Memory-FS (Fallback)
8. Schreibe Tests in `tests/unitTests/fileSystemRepository.spec.ts`:
   - Mock `showDirectoryPicker()`
   - Testen der Directory-Listing
   - Testen der Blob-Ladung
   - Testen des Fallbacks

**Security:**
- Permission muss von User explizit erteilt werden
- Handle nur während aktiver Session gültig
- Bei Permission-Denial: Graceful Fallback

**Constraints:**
- Interface `FileSystemRepository` nicht ändern (nur erweitern)
- Bestehende Memory-FS-Tests bleiben grün

**Erfolg:** Echtes Dateisystem zugänglich (wenn User erlaubt), Fallback funktioniert, Tests grün.

---

### Prompt 2.2: Import-Workflow mit Progress

**Aufgabe:** Erweitere `services/libraryRepository.ts` um Import mit Fortschritts-Tracking.

**Anforderungen:**
1. Öffne `services/libraryRepository.ts`
2. Definiere `ImportProgress` Interface (siehe browserplan.md, Abschnitt I)
3. Füge zu `LibraryRepository` Interface hinzu:
   ```typescript
   importDirectory(
     path: string,
     options?: { recursive?: boolean },
     onProgress?: (progress: ImportProgress) => void
   ): Promise<void>
   ```
4. Implementiere `importDirectory()` in `createLocalRepository()`:
   - Hole File-Liste von `fileSystemRepository.listDir(path)`
   - Iteriere durch Dateien
   - Filtere auf unterstützte Formate (.wav, .mp3, .aiff, etc.)
   - Für jede Datei:
     - Extrahiere Metadaten aus Pfad (Category/Product/Bank)
     - Rufe `importFile()` auf
     - Rufe `onProgress()` Callback auf
   - Bei recursive=true: Rekursiv in Unterordnern
5. Implementiere Metadaten-Extraktion:
   ```typescript
   function extractMetadataFromPath(path: string): Partial<LibraryItem> {
     // Schema: /Category/Product/Bank/SubBank/filename.wav
     const parts = path.split('/').filter(Boolean)
     return {
       category: parts[0],
       product: parts[1],
       bank: parts[2],
       subBank: parts[3],
       vendor: 'user'
     }
   }
   ```
6. Fehlerbehandlung:
   - Unsupported format → Skip, in errors[] sammeln
   - Read error → Skip, in errors[] sammeln
   - Am Ende: Wenn errors.length > 0, logge Warnung
7. Schreibe Tests in `tests/unitTests/libraryImport.spec.ts`:
   - Testen des Progress-Callbacks
   - Testen der Metadaten-Extraktion
   - Testen der rekursiven Import
   - Testen der Fehlerbehandlung

**Performance:**
- Batch-Import (max 10 Files gleichzeitig)
- Debounce Progress-Updates (max alle 100ms)

**Erfolg:** Directory-Import funktioniert, Progress wird gemeldet, Metadaten extrahiert, Tests grün.

---

### Prompt 2.3: Recent Files Tracking

**Aufgabe:** Implementiere `composables/useRecentFiles.ts` für Recent-Files-Tracking.

**Anforderungen:**
1. Erstelle `composables/useRecentFiles.ts`
2. Definiere `RecentFileEntry` Interface (siehe browserplan.md, Abschnitt E)
3. Implementiere Composable:
   ```typescript
   export function useRecentFiles() {
     const maxRecent = 50
     const storageKey = 'drumcomputer_recent_files_v1'
     
     function addRecent(entry: Omit<RecentFileEntry, 'timestamp'>): void
     function getRecent(limit?: number): RecentFileEntry[]
     function clearRecent(): void
     function removeRecent(id: string): void
     
     return { addRecent, getRecent, clearRecent, removeRecent }
   }
   ```
4. Implementiere localStorage-Persistence:
   - Bei `addRecent()`: Füge an Anfang ein, begrenze auf maxRecent, speichere
   - Deduplizierung: Wenn ID bereits vorhanden, verschiebe nach vorne
   - Sortierung: Immer nach timestamp DESC
5. Integriere in `stores/browser.ts`:
   - Neue Action `loadRecentFiles()`: Ruft `getRecent()` auf, setzt results
   - In `importSelected()`: Rufe `addRecent()` auf
   - Neue Getter `recentFiles`: Gibt aktuelle Recent-Liste zurück
6. Aktualisiere `stores/control.ts` Recent-Page:
   - `leftModel.items` von `browser.recentFiles`
   - Zeige Datum relativ (z.B. "vor 5 Minuten", "heute", "gestern")
7. Schreibe Tests in `tests/unitTests/recentFiles.spec.ts`:
   - Testen der Deduplizierung
   - Testen der Max-Limit
   - Testen der Sortierung
   - Testen der localStorage-Persistence

**Constraints:**
- Client-only (localStorage nur im Browser)
- Graceful Degradation wenn localStorage voll

**Erfolg:** Recent Files werden getrackt, in Browser-Store verfügbar, Tests grün.

---

## Phase 3: Features

### Prompt 3.1: Favorites-System

**Aufgabe:** Implementiere Favorites-System in `services/libraryRepository.ts`.

**Anforderungen:**
1. Öffne `services/libraryRepository.ts`
2. Erweitere `LibraryRepository` Interface:
   ```typescript
   addToFavorites(itemId: string): Promise<void>
   removeFromFavorites(itemId: string): Promise<void>
   getFavorites(): Promise<LibraryItem[]>
   isFavorite(itemId: string): Promise<boolean>
   ```
3. Implementiere in `createLocalRepository()`:
   - Neuer localStorage Key: `drumcomputer_favorites_v1`
   - Speichere Set von Item-IDs
   - `addToFavorites()`: Füge ID zu Set hinzu, persistiere
   - `removeFromFavorites()`: Entferne ID von Set, persistiere
   - `getFavorites()`: Filtere items nach IDs im Set
   - `isFavorite()`: Prüfe ob ID im Set
4. Integriere in `stores/browser.ts`:
   - Neue Action `toggleFavorite(itemId: string)`: Toggle Favorite-Status
   - Erweitere `search()`: Wenn `filters.favorites === true`, nur Favoriten zurückgeben
   - Update `toDisplayModels()`: Zeige Stern-Symbol bei Favoriten (in subtitle)
5. Füge zu Control-Store Browser-Page hinzu:
   - Soft-Button "Favorites": Toggle Favorites-Filter
   - Button highlighted wenn aktiv
6. Schreibe Tests in `tests/unitTests/favorites.spec.ts`:
   - Testen von Add/Remove
   - Testen von Toggle
   - Testen des Favorites-Filters
   - Testen der Persistence

**UI-Integration (ohne Änderungen):**
- Subtitle-Format: `"{tags} ★"` für Favoriten
- Soft-Button wird via `enabled` Property highlighted

**Erfolg:** Favorites funktionieren, Filter anwendbar, Tests grün.

---

### Prompt 3.2: Sample Preview/Prehear

**Aufgabe:** Implementiere `composables/useSamplePreview.client.ts` für Audio-Preview.

**Anforderungen:**
1. Erstelle `composables/useSamplePreview.client.ts`
2. Definiere `PreviewState` Interface (siehe browserplan.md, Abschnitt F)
3. Implementiere Composable:
   ```typescript
   export function useSamplePreview() {
     const audioContext = inject<AudioContext>('audioContext')
     const state = reactive<PreviewState>({ 
       isPlaying: false,
       currentFile: null,
       progress: 0,
       duration: 0
     })
     
     async function loadAndPlay(path: string, blob?: Blob): Promise<void>
     function stop(): void
     function pause(): void
     function resume(): void
     function seek(position: number): void
     
     return { state, loadAndPlay, stop, pause, resume, seek }
   }
   ```
4. Implementiere Audio-Loading:
   - Wenn blob gegeben: Decode blob
   - Sonst: Hole blob von fileSystemRepository, dann decode
   - Nutze `audioContext.decodeAudioData()`
5. Implementiere Playback:
   - Erstelle AudioBufferSourceNode
   - Verbinde mit audioContext.destination
   - Tracke Progress via requestAnimationFrame
   - Stop bei Ende automatisch
6. Integriere in `stores/browser.ts`:
   - Neue Action `prehearSelected()`: Ruft `preview.loadAndPlay()` auf
   - Neue Action `stopPrehear()`: Ruft `preview.stop()` auf
   - Neue Getter `previewState`: Gibt preview.state zurück
7. Aktualisiere `stores/control.ts`:
   - Bei BROWSER_PREHEAR: Rufe `browser.prehearSelected()` auf
   - Bei BROWSER_STOP: Rufe `browser.stopPrehear()` auf
   - Zeige Preview-Parameter in Encoder-Slots während Playback:
     - Preview Vol, Start, End, Tune (für Phase 4)
8. Schreibe Tests in `tests/unitTests/samplePreview.spec.ts`:
   - Mock AudioContext
   - Testen von Load & Play
   - Testen von Stop
   - Testen von Progress-Tracking

**Constraints:**
- Client-only (.client.ts Suffix)
- Nutze bestehenden AudioContext (inject)
- Cleanup bei Component-Unmount

**Erfolg:** Preview funktioniert, Audio wird abgespielt, Tests grün.

---

### Prompt 3.3: Sortierung

**Aufgabe:** Implementiere Sortier-Funktionalität in `stores/browser.ts`.

**Anforderungen:**
1. Öffne `stores/browser.ts`
2. Definiere `SortMode` Type (siehe browserplan.md, Abschnitt H)
3. Füge zum State hinzu:
   ```typescript
   sortMode: SortMode
   ```
4. Implementiere Actions:
   - `setSortMode(mode: SortMode)`: Setzt Mode, ruft `sortResults()` auf
   - `sortResults()`: Sortiert `library.results` und `files.entries` nach Mode
5. Implementiere Sortier-Logik:
   - `name-asc`: Sortiere nach title/name aufsteigend
   - `name-desc`: Sortiere nach title/name absteigend
   - `date-asc`: Sortiere nach importedAt/timestamp aufsteigend (älteste zuerst)
   - `date-desc`: Sortiere nach importedAt/timestamp absteigend (neueste zuerst)
   - `relevance`: Originale Reihenfolge (von search())
6. Integriere in FILE Mode:
   - Soft-Button "Sort" öffnet Sort-Menü (simuliert via Encoder-Field)
   - Encoder-Field "Sort": Options: ["Name ↑", "Name ↓", "Date ↑", "Date ↓"]
7. Update Display:
   - Zeige aktuellen Sort-Mode in subtitle (z.B. "Sorted by Name ↑")
8. Schreibe Tests in `tests/unitTests/browserSort.spec.ts`:
   - Testen aller Sort-Modi
   - Testen der Sortierung nach Mode-Wechsel
   - Testen der Persistenz des Sort-Modes

**Performance:**
- Sortierung nur bei Bedarf (lazy)
- Cache sortierte Liste bis nächste Änderung

**Erfolg:** Sortierung funktioniert für alle Modi, Tests grün.

---

## Phase 4: Advanced Features

### Prompt 4.1: Quick-Browse System

**Aufgabe:** Implementiere `composables/useQuickBrowse.ts` für Browse-History.

**Anforderungen:**
1. Erstelle `composables/useQuickBrowse.ts`
2. Definiere `BrowseHistoryEntry` Interface (siehe browserplan.md, Abschnitt G)
3. Implementiere Composable:
   ```typescript
   export function useQuickBrowse() {
     const maxHistory = 50
     const storageKey = 'drumcomputer_quick_browse_v1'
     const history = ref<BrowseHistoryEntry[]>([])
     
     function recordBrowse(entry: Omit<BrowseHistoryEntry, 'timestamp'>): void
     function getLastBrowse(contextId: string): BrowseHistoryEntry | null
     function restoreBrowse(entry: BrowseHistoryEntry): void
     function clearHistory(): void
     
     return { history, recordBrowse, getLastBrowse, restoreBrowse, clearHistory }
   }
   ```
4. Implementiere History-Tracking:
   - Bei `recordBrowse()`: Füge Entry mit timestamp hinzu
   - Gruppiere nach contextId (ein Entry pro Context)
   - Limit auf maxHistory
   - Persistiere in localStorage
5. Implementiere `restoreBrowse()`:
   - Setze Browser-Mode
   - Setze Query
   - Setze Filters
   - Rufe `browser.search()` auf
   - Selektiere Item (wenn selectedId vorhanden)
6. Integriere in `stores/browser.ts`:
   - In `importSelected()`: Rufe `quickBrowse.recordBrowse()` auf
   - Neue Action `openQuickBrowse(contextId: string)`: Lädt letzte Suche für Context
7. Integriere in `stores/control.ts`:
   - Neuer Soft-Button "Quick Browse" in Browser-Page (Shift+Search?)
   - Bei Trigger: Rufe `browser.openQuickBrowse(currentPadId)` auf
8. Schreibe Tests in `tests/unitTests/quickBrowse.spec.ts`:
   - Testen der History-Aufzeichnung
   - Testen von getLastBrowse()
   - Testen von restoreBrowse()
   - Testen der Context-Gruppierung

**Context-ID-Schema:**
- Pads: `pad-{index}` (z.B. "pad-0")
- Plugin-Slots: `plugin-{soundIndex}-{slotIndex}`
- Sounds: `sound-{index}`

**Erfolg:** Quick-Browse funktioniert, History wird getrackt, Restore funktioniert, Tests grün.

---

### Prompt 4.2: Tag-Management UI Flow

**Aufgabe:** Erweitere Browser-Store um Tag-Management mit Display-Overlay.

**Anforderungen:**
1. Öffne `stores/browser.ts`
2. Füge zum State hinzu:
   ```typescript
   tagDialogOpen: boolean
   tagDialogItemId: string | null
   availableTags: string[]  // Global alle vorhandenen Tags
   ```
3. Implementiere Actions:
   - `openTagDialog(itemId: string)`: Öffnet Dialog, lädt Tags
   - `closeTagDialog()`: Schließt Dialog
   - `addTagToSelected(tag: string)`: Fügt Tag zum aktuellen Item hinzu
   - `removeTagFromSelected(tag: string)`: Entfernt Tag vom Item
   - `getAvailableTags()`: Gibt alle verwendeten Tags zurück
4. Implementiere Tag-Sammlung:
   - Beim App-Start: Scanne alle Library-Items, sammle Tags
   - Speichere in `availableTags`
   - Update bei jedem Import
5. Integriere 4D-Encoder für Tag-Dialog:
   - Wenn `tagDialogOpen === true`:
     - Encoder-Felder zeigen verfügbare Tags
     - Turn scrollt durch Tags
     - Press fügt Tag hinzu/entfernt Tag
     - Tilt right schließt Dialog
6. Update Display-Models:
   - Wenn Tag-Dialog offen: Overlay-View
   - Linkes Display: "Add Tag" + verfügbare Tags (mit Checkbox wenn bereits zugewiesen)
   - Rechtes Display: Aktuelle Tags des Items (mit Remove-Option)
7. Integriere in Control-Store:
   - Soft-Button "Tag": Öffnet Tag-Dialog für selektiertes Item
   - In Tag-Dialog: Button "Close" schließt Dialog
8. Schreibe Tests in `tests/unitTests/tagManagement.spec.ts`:
   - Testen der Tag-Dialog-Öffnung
   - Testen von Add/Remove Tag
   - Testen der availableTags-Sammlung
   - Testen der Encoder-Navigation im Tag-Dialog

**UI-Flow (ohne Template-Änderungen):**
1. User wählt Item in Browser-Liste
2. User drückt Soft-Button "Tag"
3. Display wechselt zu Tag-Dialog (via Display-Model)
4. User navigiert mit 4D-Encoder, fügt Tags hinzu
5. User drückt "Close" oder Tilt right
6. Display kehrt zu Browser-Liste zurück

**Erfolg:** Tag-Dialog funktioniert, Tags können hinzugefügt/entfernt werden, Tests grün.

---

### Prompt 4.3: Category/Product/Bank Hierarchie

**Aufgabe:** Erweitere `services/libraryRepository.ts` um hierarchische Metadaten.

**Anforderungen:**
1. Öffne `services/libraryRepository.ts`
2. Erweitere `LibraryItem` Interface (siehe browserplan.md, Abschnitt K):
   ```typescript
   category?: string
   product?: string
   bank?: string
   subBank?: string
   character?: string
   vendor?: 'factory' | 'user'
   ```
3. Erweitere `LibraryRepository` Interface:
   ```typescript
   getCategories(): Promise<string[]>
   getProducts(category?: string): Promise<string[]>
   getBanks(product?: string): Promise<string[]>
   getSubBanks(bank?: string): Promise<string[]>
   ```
4. Implementiere Hierarchie-Queries in `createLocalRepository()`:
   - Scanne alle Items, sammle unique Werte
   - Bei Filter-Parameter: Filtere auf Parent-Wert
   - Beispiel: `getProducts('Drums')` gibt nur Products in Category "Drums"
5. Update `importDirectory()` (von Prompt 2.2):
   - Nutze verbesserte `extractMetadataFromPath()` Funktion
   - Setze alle Metadaten-Felder
6. Integriere in `stores/browser.ts`:
   - Update `getAvailableOptions()`:
     - Für "category": Rufe `repo.getCategories()` auf
     - Für "product": Rufe `repo.getProducts(filters.category)` auf
     - Für "bank": Rufe `repo.getBanks(filters.product)` auf
     - Für "subBank": Rufe `repo.getSubBanks(filters.bank)` auf
   - Update `applyFilters()`: Filtere nach allen hierarchischen Feldern
7. Update 4D-Encoder-Felder:
   - Category-Feld: Optionen von `getCategories()`
   - Product-Feld: Optionen abhängig von gewählter Category
   - Bank-Feld: Optionen abhängig von gewähltem Product
   - SubBank-Feld: Optionen abhängig von gewählter Bank
8. Schreibe Tests in `tests/unitTests/libraryHierarchy.spec.ts`:
   - Testen der Hierarchie-Queries
   - Testen der Filter-Kaskade (Category → Product → Bank)
   - Testen der Metadaten-Extraktion aus Pfaden

**Pfad-Schema:**
```
/Drums/808/Kicks/Deep/kick_01.wav
 ^cat   ^prod ^bank ^sub
```

**Erfolg:** Hierarchie funktioniert, Filter sind abhängig voneinander, Tests grün.

---

## Zusätzliche Prompts

### Bonus Prompt: Missing Samples Dialog

**Aufgabe:** Implementiere Missing-Samples-Dialog-Logik (Optional).

**Anforderungen:**
1. Erstelle `composables/useMissingSamples.ts`
2. Implementiere Detection:
   - Beim Pattern/Soundbank-Laden: Prüfe ob alle Sample-Pfade existieren
   - Sammle fehlende Samples
3. Implementiere Dialog-State:
   ```typescript
   interface MissingSample {
     id: string
     name: string
     originalPath: string
     usedIn: string[]  // Sound/Group-IDs die dieses Sample nutzen
   }
   
   function useMissingSamples() {
     const missingSamples = ref<MissingSample[]>([])
     
     function detectMissing(): Promise<void>
     function ignoreSample(id: string): void
     function ignoreAll(): void
     function findSample(id: string, newPath: string): void
     function purgeSample(id: string): void
   }
   ```
4. Integriere in Load-Flow:
   - Nach Pattern-Load: Rufe `detectMissing()` auf
   - Wenn missingSamples.length > 0: Öffne Dialog
5. Dialog-UI via Display-Models:
   - Linkes Display: Liste fehlender Samples
   - Rechtes Display: Aktionen (IGNORE, IGNORE ALL, FIND, PURGE)
6. Schreibe Tests

**Erfolg:** Dialog erkennt fehlende Samples, bietet Aktionen an.

---

### Bonus Prompt: Performance-Optimierung

**Aufgabe:** Optimiere Browser-Performance für große Libraries.

**Anforderungen:**
1. Implementiere Virtual Scrolling für Ergebnisliste (>100 Items)
2. Implementiere Search-Debouncing (300ms)
3. Implementiere Caching für Category/Product-Listen
4. Migriere von localStorage zu IndexedDB (wenn Library >1000 Items)
5. Implementiere Lazy-Loading für Thumbnails/Waveforms
6. Schreibe Performance-Tests

**Erfolg:** Browser bleibt flüssig bei 10.000+ Items.

---

## Prompts für Tests

### Test-Prompt: Integration-Tests

**Aufgabe:** Schreibe umfassende Integration-Tests.

**Anforderungen:**
1. Erweitere `tests/unitTests/controlBrowserIntegration.spec.ts`
2. Teste komplette Workflows:
   - Browser öffnen → Filter setzen → Suche → Item laden
   - Recent Files → Quick-Browse → Restore → Load
   - Favorites → Toggle → Filter → Load
   - Preview → Play → Stop → Load
3. Teste Edge-Cases:
   - Leere Ergebnisliste
   - Permission Denial (File System)
   - Import-Fehler
   - Fehlende Samples

**Erfolg:** Alle Workflows getestet, Tests grün.

---

## Reihenfolge der Ausführung

Führe die Prompts in folgender Reihenfolge aus:

1. **Phase 1** (Kern-Navigation):
   - Prompt 1.1 (4D-Encoder)
   - Prompt 1.2 (Browser-Filter)
   - Prompt 1.3 (Control-Integration)

2. **Phase 2** (File System & Import):
   - Prompt 2.1 (File System API)
   - Prompt 2.2 (Import Workflow)
   - Prompt 2.3 (Recent Files)

3. **Phase 3** (Features):
   - Prompt 3.1 (Favorites)
   - Prompt 3.2 (Preview)
   - Prompt 3.3 (Sortierung)

4. **Phase 4** (Advanced):
   - Prompt 4.1 (Quick-Browse)
   - Prompt 4.2 (Tag-Management)
   - Prompt 4.3 (Hierarchie)

5. **Optional** (Bonus):
   - Bonus Prompt: Missing Samples
   - Bonus Prompt: Performance
   - Test-Prompt: Integration-Tests

Zwischen den Phasen: Tests laufen lassen und Lint-Checks durchführen.

---

## Hinweise für Agenten

- **Constraints beachten:** Keine UI-Änderungen (Pug/Vuetify), nur Logik
- **Tests zuerst:** Implementiere Tests parallel oder vor der Implementierung
- **Kleine Commits:** Jeder Prompt = 1-3 Commits
- **Dokumentation:** JSDoc für alle neuen Funktionen
- **Backward-Kompatibilität:** Bestehende Features nicht brechen
- **Performance:** Denke an Caching und Lazy-Loading

Bei Fragen oder Unklarheiten: Siehe `browserplan.md` für Details.
