<template>
  <div class="mode-column" title="Mode column with shift-layer hints">
    <button
      v-for="mode in modes"
      :key="mode.label"
      class="mode-btn"
      type="button"
      :title="mode.hint"
      :aria-label="mode.hint"
    >
      <span class="symbol">{{ mode.symbol }}</span>
      <span class="text">{{ mode.label }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

type ModeButton = {
  label: string
  symbol: string
  hint: string
}

const DEFAULT_MODES: ModeButton[] = [
  { label: 'Scene', symbol: '', hint: 'Scene mode (hold to pin); Shift: Scene grid alt' },
  { label: 'Pattern', symbol: '', hint: 'Pattern mode (hold to pin); Shift: Duplicate pattern' },
  { label: 'Events', symbol: '', hint: 'Events/step mode; Shift: Clear events' },
  { label: 'Variation', symbol: '', hint: 'Variation/randomize; Shift: Humanize' },
  { label: 'Duplicate', symbol: '', hint: 'Duplicate selection; Shift: Copy to new slot' },
  { label: 'Select', symbol: '', hint: 'Select pad/group; Shift: Group select' },
  { label: 'Solo', symbol: '', hint: 'Solo (momentary/pin); Shift: Mute layer' },
  { label: 'Mute', symbol: '', hint: 'Mute (momentary/pin); Shift: Solo layer' },
  { label: 'Shift', symbol: '⇧', hint: 'Hold for secondary functions' }
]

export default defineComponent({
  name: 'ModeColumnPlaceholder',
  props: {
    modes: {
      type: Array as () => ModeButton[],
      default: () => DEFAULT_MODES
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.mode-column {
  display: flex;
  flex-direction: column;
  gap: @space-xs;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: @space-xs;
  padding: @space-xs @space-s;
  border: 1px solid #2f3645;
  border-radius: @radius-s;
  background: linear-gradient(180deg, #191e29, #111520);
  color: @color-text-primary;
  font-size: @font-size-xs;
  cursor: default;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.mode-btn:hover {
  border-color: #f68b1e;
  background: linear-gradient(180deg, #222836, #161a25);
  box-shadow:
    0 0 8px fade(#f68b1e, 30%),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

.symbol {
  font-size: @font-size-s;
  color: #f68b1e;
}

.text {
  flex: 1 1 auto;
  text-align: left;
}
</style>
