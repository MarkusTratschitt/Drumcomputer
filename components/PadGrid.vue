<template lang="pug">
  client-only(tag="div")
    .pad-grid(
      role="grid"
      tabindex="0"
      aria-label="Pad grid"
      :aria-rowcount="4"
      :aria-colcount="4"
      @keydown.arrow-up.prevent="moveSelection(-4)"
      @keydown.arrow-down.prevent="moveSelection(4)"
      @keydown.arrow-left.prevent="moveSelection(-1)"
      @keydown.arrow-right.prevent="moveSelection(1)"
      @keydown.home.prevent="selectIndex(0)"
      @keydown.end.prevent="selectIndex(pads.length - 1)"
      @keydown.page-up.prevent="selectRow(0)"
      @keydown.page-down.prevent="selectRow(3)"
      :style="velocityStyle"
    )
      PadCell(
        v-for="(pad, index) in pads"
        :key="pad"
        :ref="setPadRef(pad)"
        :pad-id="pad"
        :label="padLabel(pad)"
        :is-selected="selectedPad === pad"
        :is-focusable="selectedPad === pad"
        :is-triggered="padStates[pad]?.isTriggered ?? false"
        :is-playing="padStates[pad]?.isPlaying ?? false"
        :is-empty="padIsEmpty(pad)"
        :key-label="keyLabels[index]"
        :pad-color="padColors[index] ?? padColors[0]"
        role="gridcell"
        :aria-label="padAriaLabel(pad)"
        :aria-rowindex="Math.floor(index / 4) + 1"
        :aria-colindex="(index % 4) + 1"
        @pad:down="$emit('pad:down', $event)"
        @pad:select="$emit('pad:select', $event)"
      )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PadCell from './PadCell.vue'
import type { DrumPadId } from '@/types/drums'
// Renders a 4x4 pad grid with keyboard navigation and selection, delegating interactions to PadCell instances.

const KEY_LABELS = [
  'Q','W','E','R',
  'A','S','D','F',
  'Z','X','C','V',
  '1','2','3','4'
]

type PadState = {
  label: string
  isTriggered: boolean
  isPlaying: boolean
}

export default defineComponent({
  name: 'PadGrid',
  components: { 
    PadCell,
    
    },

  props: {
    pads: { type: Array as () => DrumPadId[], required: true },
    selectedPad: { type: String as () => DrumPadId | null, default: null },
    velocity: { type: Number, default: 1 },
    padStates: {
      type: Object as () => Partial<Record<DrumPadId, PadState>>,
      default: () => ({})
    },
    padColors: {
      type: Array as () => string[],
      default: () => [
        '#12c8ff','#00d5ff','#00c3ff','#00b4ff',
        '#ffb840','#ff9f30','#ffb43c','#ff9c2a',
        '#ff3a3a','#ff4f4f','#ffd13a','#ffbc2a',
        '#46e3ff','#38d4ff','#2cc5ff','#20baff'
      ]
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

    keyLabels(): string[] {
      return KEY_LABELS
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
    if (this.pads.length !== this.keyLabels.length) {
      console.warn(
        `[PadGrid] pads (${this.pads.length}) ≠ keyLabels (${this.keyLabels.length})`
      )
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

    padAriaLabel(pad: DrumPadId): string {
      const label = this.padLabel(pad)
      return `${label} pad`
    },

    padIsEmpty(pad: DrumPadId): boolean {
      return !this.padStates[pad]?.label
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
@import '@/styles/variables.less';

.pad-grid {
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: @space-s;
  width:100%;
  height:100%;
  background: @color-surface-2;
  padding: @space-m;
  box-sizing: border-box;
  border-radius: @radius-l;
  border: 1px solid @color-border-2;

}

.pad-grid:focus-visible {
  outline: @outline-focus;
  outline-offset: @outline-focus-offset;
  border-color: #00f8ff;
}
.pad-cell.is-selected {
  border-color: @color-accent-primary;
  outline: 2px dashed #00f8ff;
  outline-offset: 3px;
}
.pad-cell:focus-visible:not(.is-selected) {
  outline: @outline-focus;
  outline-offset: @outline-focus-offset;
  box-shadow: 0 0 calc(12px * var(--pad-velocity)) ~"rgba(0, 255, 255, calc(0.2 + 0.6 * var(--pad-velocity)))";
  box-shadow: 0 0 calc(12px * var(--pad-velocity)) fade(@color-accent-primary, 60%);
}

</style>
