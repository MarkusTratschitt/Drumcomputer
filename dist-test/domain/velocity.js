export const STEP_VELOCITY_LEVELS = [0.7, 1, 1.25];
export const DEFAULT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[0];
export const ACCENT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[STEP_VELOCITY_LEVELS.length - 1];
const EPSILON = 0.001;
const matchesLevel = (value, level) => Math.abs(value - level) < EPSILON;
export function clampVelocity(value) {
    const resolved = typeof value === 'number' ? value : DEFAULT_STEP_VELOCITY;
    const clamped = Math.max(STEP_VELOCITY_LEVELS[0], Math.min(ACCENT_STEP_VELOCITY, resolved));
    const closest = STEP_VELOCITY_LEVELS.find((level) => matchesLevel(clamped, level));
    return closest ?? clamped;
}
export function cycleVelocity(current) {
    if (typeof current !== 'number') {
        return DEFAULT_STEP_VELOCITY;
    }
    const index = STEP_VELOCITY_LEVELS.findIndex((level) => matchesLevel(current, level));
    if (index === -1) {
        return DEFAULT_STEP_VELOCITY;
    }
    const nextIndex = index + 1;
    if (nextIndex >= STEP_VELOCITY_LEVELS.length) {
        return null;
    }
    const nextValue = STEP_VELOCITY_LEVELS[nextIndex];
    if (typeof nextValue !== 'number') {
        return null;
    }
    return nextValue;
}
export function velocityToIntensity(value) {
    if (!value)
        return 0;
    return Math.min(1, value / ACCENT_STEP_VELOCITY);
}
//# sourceMappingURL=velocity.js.map