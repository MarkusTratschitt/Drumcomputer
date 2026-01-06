<template>
  <div class="soft-strip">
    <button
      v-for="(btn, index) in normalizedButtons"
      :key="index"
      class="soft-btn"
      type="button"
      :title="buttonTitle(btn, index)"
      :aria-label="buttonTitle(btn, index)"
      :disabled="!btn.enabled"
      @click="$emit('press', index)"
    >
      <span class="symbol">{{ index + 1 }}</span>
      <span class="label">{{ btn.label }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

type SoftButtonModel = {
  label: string
  actionId: string
  enabled: boolean
  shiftLabel?: string | undefined
  description?: string | undefined
}

const normalizeButtons = (buttons: SoftButtonModel[]): SoftButtonModel[] => {
  const normalized = buttons.map((btn) => ({
    label: btn.label ?? '',
    actionId: btn.actionId ?? 'noop',
    enabled: btn.enabled !== false,
    shiftLabel: btn.shiftLabel ?? undefined,
    description: btn.description ?? undefined
  }))
  while (normalized.length < 8) {
    normalized.push({
      label: '',
      actionId: 'noop',
      enabled: false,
      shiftLabel: undefined,
      description: undefined
    })
  }
  return normalized.slice(0, 8)
}

export default defineComponent({
  name: 'SoftButtonStrip',
  props: {
    buttons: {
      type: Array as PropType<SoftButtonModel[]>,
      default: () => []
    },
    shiftHeld: {
      type: Boolean,
      default: false
    }
  },
  emits: ['press'],
  computed: {
    normalizedButtons(): SoftButtonModel[] {
      return normalizeButtons(this.buttons ?? [])
    }
  },
  methods: {
    buttonTitle(btn: SoftButtonModel, index: number) {
      const label = btn.label || `Soft ${index + 1}`
      if (btn.shiftLabel) {
        return this.shiftHeld ? `${label} (${btn.shiftLabel})` : `${label} (SHIFT: ${btn.shiftLabel})`
      }
      return label
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
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.6),
    inset 0 -1px 0 rgba(0,0,0,0.25);
}

.soft-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.soft-btn:hover:enabled {
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
