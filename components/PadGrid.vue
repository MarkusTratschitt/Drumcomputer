<template lang="pug">
.pad-grid(
  role="grid"
  tabindex="0"
  @keydown.arrow-up.prevent="moveSelection(-4)"
  @keydown.arrow-down.prevent="moveSelection(4)"
  @keydown.arrow-left.prevent="moveSelection(-1)"
  @keydown.arrow-right.prevent="moveSelection(1)"
  @keydown.home.prevent="selectIndex(0)"
  @keydown.end.prevent="selectIndex(pads.length - 1)"
  @keydown.page-up.prevent="selectRow(0)"
  @keydown.page-down.prevent="selectRow(3)"
)
  PadCell(
    v-for="pad in pads"
    :key="pad"
    :ref="setPadRef(pad)"
    :pad-id="pad"
    :label="padLabel(pad)"
    :is-selected="selectedPad === pad"
    :is-focusable="selectedPad === pad"
    :is-triggered="padStates[pad]?.isTriggered ?? false"
    :is-playing="padStates[pad]?.isPlaying ?? false"
    @pad:down="$emit('pad:down', $event)"
    @pad:select="$emit('pad:select', $event)"
  )

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PadCell from './PadCell.vue'
import type { DrumPadId } from '@/types/drums'

type PadState = {
  label: string
  isTriggered: boolean
  isPlaying: boolean
}

export default defineComponent({
  name: 'PadGrid',
  components: { PadCell },

  props: {
    pads: { type: Array as () => DrumPadId[], required: true },
    selectedPad: { type: String as () => DrumPadId | null, default: null },
    velocity: { type: Number, default: 1 },
    padStates: {
      type: Object as () => Partial<Record<DrumPadId, PadState>>,
      default: () => ({})
    }
  },

  emits: ['pad:down', 'pad:select'],

  data() {
    return {
      internalPadRefs: {} as Record<DrumPadId, InstanceType<typeof PadCell> | undefined>
    }
  },

  computed: {
    velocityStyle(): Record<string, string> {
      const clamped = Math.min(1, Math.max(0, this.velocity))
      return { '--pad-velocity': clamped.toString() }
    },

    padRefs(): Record<DrumPadId, InstanceType<typeof PadCell> | undefined> {
      return this.internalPadRefs
    }
  },

  watch: {
    selectedPad(newPad: DrumPadId | null) {
      if (!newPad) return
      this.$nextTick(() => {
        const ref = this.padRefs[newPad]
        ref?.$el?.focus?.()
      })
    }
  },

  mounted() {
    if (!this.selectedPad && this.pads.length > 0) {
      this.$emit('pad:select', this.pads[0])
    }
  },

  methods: {
    setPadRef(pad: DrumPadId) {
      return (el: InstanceType<typeof PadCell> | null) => {
        if (el) {
          this.internalPadRefs[pad] = el
        } else {
          delete this.internalPadRefs[pad]
        }
      }
    },

    padLabel(pad: DrumPadId): string {
      return this.padStates[pad]?.label ?? pad.toUpperCase()
    },

    handlePadDown(pad: DrumPadId, velocity: number) {
      this.$emit('pad:down', pad, velocity)
    },

    handlePadSelect(pad: DrumPadId) {
      this.$emit('pad:select', pad)
    },

    selectIndex(index: number) {
      if (index < 0 || index >= this.pads.length) return
      this.$emit('pad:select', this.pads[index])
    },

    selectRow(row: number) {
      const columns = 4
      const index = row * columns
      if (index < this.pads.length) {
        this.$emit('pad:select', this.pads[index])
      }
    },

    moveSelection(offset: number) {
      if (!this.selectedPad) return

      const index = this.pads.indexOf(this.selectedPad)
      if (index === -1) return

      const columns = 4
      let nextIndex = index + offset

      if (offset === -1 && index % columns === 0) {
        nextIndex = index + (columns - 1)
      }

      if (offset === 1 && (index + 1) % columns === 0) {
        nextIndex = index - (columns - 1)
      }

      if (nextIndex < 0 || nextIndex >= this.pads.length) return
      this.$emit('pad:select', this.pads[nextIndex])
    }
  }
})
</script>

<style scoped lang="less">
.pad-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  background: #0a0d12;
  border-radius: 16px;
  border: 1px solid #1f2838;
  height: 100%;
}

.pad-grid:focus-visible {
  outline: 2px solid #00f8ff;
  outline-offset: 4px;
}

.pad-cell.is-selected {
  border-color: #00f8ff;
}

.pad-cell:focus-visible:not(.is-selected) {
  outline: 2px dashed #00f8ff;
  outline-offset: 3px;
}

.pad-cell.is-triggered::after {
  box-shadow: 0 0 calc(12px * var(--pad-velocity))
    rgba(0, 255, 255, calc(0.2 + 0.6 * var(--pad-velocity)));
}
</style>
