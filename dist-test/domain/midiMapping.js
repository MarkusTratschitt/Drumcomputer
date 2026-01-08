const defaultPads = [
    'pad1',
    'pad2',
    'pad3',
    'pad4',
    'pad5',
    'pad6',
    'pad7',
    'pad8',
    'pad9',
    'pad10',
    'pad11',
    'pad12',
    'pad13',
    'pad14',
    'pad15',
    'pad16'
];
export function defaultMidiMapping() {
    const noteMap = {};
    const noteMapInverse = {};
    defaultPads.forEach((padId, index) => {
        const note = 36 + index;
        noteMap[note] = padId;
        noteMapInverse[padId] = note;
    });
    return { noteMap, noteMapInverse, transportMap: {} };
}
//# sourceMappingURL=midiMapping.js.map