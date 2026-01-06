<template>
  <div class="soft-strip">
    <button
      v-for="btn in buttons"
      :key="btn.symbol"
      class="soft-btn"
      type="button"
      :title="btn.hint"
      :aria-label="btn.hint"
    >
      <span class="symbol">{{ btn.symbol }}</span>
      <span class="label">{{ btn.label }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

type SoftButton = {
  symbol: string
  label: string
  hint: string
}

const DEFAULT_BUTTONS: SoftButton[] = [
  { symbol: '', label: '', hint: 'Soft button 1 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 2 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 3 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 4 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 5 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 6 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 7 (contextual)' },
  { symbol: '', label: '', hint: 'Soft button 8 (contextual)' }
]

export default defineComponent({
  name: 'SoftButtonStripPlaceholder',
  props: {
    buttons: {
      type: Array as () => SoftButton[],
      default: () => DEFAULT_BUTTONS
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.soft-strip {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: @space-xs;
}

.soft-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: @space-xxs @space-xs;
  border: 1px solid #3a3f49;
  border-radius: 6px;
  background: linear-gradient(180deg, #cfd2d8, #9ea3ab);
  color: #1c1f24;
  font-size: @font-size-xs;
  cursor: default;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.6),
    inset 0 -1px 0 rgba(0,0,0,0.25);
}

.soft-btn:hover {
  background: linear-gradient(180deg, #ffffff, #c7ccd4);
  border-color: #ffffff;
  box-shadow:
    0 0 8px fade(#ffffff, 35%),
    inset 0 1px 0 rgba(255,255,255,0.9);
}

.symbol {
  font-size: @font-size-s;
  line-height: 1;
}

.label {
  font-size: @font-size-xs;
  line-height: 1.1;
  opacity: 0.8;
}
</style>
