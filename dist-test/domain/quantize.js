export function quantizeToStep(time, secondsPerStep, bars, division) {
    const totalSteps = bars * division;
    const stepIndex = Math.max(0, Math.min(totalSteps - 1, Math.round(time / secondsPerStep)));
    return {
        barIndex: Math.floor(stepIndex / division),
        stepInBar: stepIndex % division
    };
}
//# sourceMappingURL=quantize.js.map