export const GRID_DIVISIONS = [1, 2, 4, 8, 16, 32, 64];
export const DEFAULT_GRID_SPEC = { bars: 1, division: 16 };
export function secondsPerStep(bpm, division) {
    return (60 / bpm) * (4 / division);
}
export function stepsPerBar(gridSpec) {
    return gridSpec.division;
}
export function normalizeGridSpec(gridSpec) {
    const division = GRID_DIVISIONS.includes((gridSpec?.division ?? DEFAULT_GRID_SPEC.division))
        ? gridSpec?.division
        : DEFAULT_GRID_SPEC.division;
    const bars = gridSpec?.bars === 1 || gridSpec?.bars === 2 || gridSpec?.bars === 4 || gridSpec?.bars === 8
        ? gridSpec.bars
        : DEFAULT_GRID_SPEC.bars;
    return { bars, division };
}
//# sourceMappingURL=timing.js.map