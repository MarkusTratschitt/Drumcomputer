import { describe, it, expect } from 'vitest';
import { use4DEncoder } from '@/composables/use4DEncoder';
describe('use4DEncoder', () => {
    it('navigates fields horizontally and clamps at bounds', () => {
        const encoder = use4DEncoder();
        encoder.setFields([
            { id: 'fileType', label: 'Type', value: 'all' },
            { id: 'category', label: 'Category', value: '' },
            { id: 'product', label: 'Product', value: '' }
        ]);
        encoder.tiltHorizontal('right');
        expect(encoder.activeFieldIndex.value).toBe(1);
        encoder.tiltHorizontal('left');
        expect(encoder.activeFieldIndex.value).toBe(0);
        encoder.tiltHorizontal('left');
        expect(encoder.activeFieldIndex.value).toBe(0);
    });
    it('adjusts numeric values when turning in value-adjust mode', () => {
        const encoder = use4DEncoder();
        encoder.setFields([{ id: 'bank', label: 'Bank', value: 5, min: 0, max: 10, step: 2 }]);
        encoder.setMode('value-adjust');
        encoder.turn(1);
        expect(encoder.fields.value[0]?.value).toBe(7);
        encoder.turn(10);
        expect(encoder.fields.value[0]?.value).toBe(10);
        encoder.turn(-20);
        expect(encoder.fields.value[0]?.value).toBe(0);
    });
    it('cycles modes with press', () => {
        const encoder = use4DEncoder();
        expect(encoder.mode.value).toBe('field-select');
        encoder.press();
        expect(encoder.mode.value).toBe('value-adjust');
        encoder.press();
        expect(encoder.mode.value).toBe('list-navigate');
        encoder.press();
        expect(encoder.mode.value).toBe('field-select');
    });
    it('navigates list vertically and with turn when in list mode', () => {
        const encoder = use4DEncoder();
        encoder.setMode('list-navigate');
        encoder.tiltVertical('down');
        expect(encoder.activeListIndex.value).toBe(1);
        encoder.turn(2);
        expect(encoder.activeListIndex.value).toBe(3);
        encoder.tiltVertical('up');
        expect(encoder.activeListIndex.value).toBe(2);
    });
    it('cycles through option values for the active field', () => {
        const encoder = use4DEncoder();
        encoder.setFields([{ id: 'fileType', label: 'Type', value: 'all', options: ['all', 'sample', 'kit'] }]);
        encoder.setMode('value-adjust');
        encoder.turn(1);
        expect(encoder.fields.value[0]?.value).toBe('sample');
        encoder.turn(10);
        expect(encoder.fields.value[0]?.value).toBe('kit');
    });
});
//# sourceMappingURL=use4DEncoder.spec.js.map