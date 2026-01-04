<template>
  <div class="knob-ring" title="Screen knobs with selector overlays">
    <div
      v-for="knob in knobs"
      :key="knob.label"
      class="knob"
      :title="knob.hint"
      :aria-label="knob.hint"
    >
      <div class="knob-cap">◯</div>
      <div class="knob-label">{{ knob.label }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

type Knob = {
  label: string
  hint: string
}

const DEFAULT_KNOBS: Knob[] = [
  { label: 'Volume', hint: 'Volume (screen knob 1)' },
  { label: 'Swing', hint: 'Swing (screen knob 2)' },
  { label: 'Tempo', hint: 'Tempo (screen knob 3)' },
  { label: 'Lock', hint: 'Lock (screen knob 4)' },
  { label: 'Group', hint: 'Group selector (screen knob 5)' },
  { label: 'Pattern', hint: 'Pattern param (screen knob 6)' },
  { label: 'Pad Mode', hint: 'Pad mode (screen knob 7)' },
  { label: 'Keyboard', hint: 'Keyboard/step (screen knob 8)' }
]

export default defineComponent({
  name: 'ScreenKnobRingPlaceholder',
  props: {
    knobs: {
      type: Array as () => Knob[],
      default: () => DEFAULT_KNOBS
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.knob-ring {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: @space-s;
}

.knob {
  background: linear-gradient(180deg, #171c27, #0f131c);
  border: 1px solid #2f3644;
  border-radius: @radius-s;
  padding: @space-xs;
  text-align: center;
  color: @color-text-primary;
  font-size: @font-size-xs;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.knob:hover {
  border-color: #f68b1e;
  box-shadow:
    0 0 8px fade(#f68b1e, 35%),
    inset 0 1px 0 rgba(255,255,255,0.07);
}

.knob-cap {
  font-size: 18px;
  line-height: 1.1;
}

.knob-label {
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
