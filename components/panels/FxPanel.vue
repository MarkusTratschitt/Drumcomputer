<template lang="pug">
  client-only(tag="div")
    .panel-shell
    .panel-header FX
      v-expansion-panels(
        v-model="activeSlot"
        accordion
        class="fx-panels"
      )
        v-expansion-panel(value="filter")
          v-expansion-panel-title Filter
          v-expansion-panel-text
            v-switch(
              label="Enabled"
              dense
              :model-value="localFx.filter.enabled"
              @update:model-value="toggleFilter"
            )
            v-slider(
              dense
              v-if="localFx.filter.enabled"
              label="Cutoff"
              hide-details
              min="200"
              max="18000"
              step="50"
              thumb-label
              :model-value="localFx.filter.frequency"
              @update:model-value="setFilterFreq"
            )
            v-slider(
              dense
              v-if="localFx.filter.enabled"
              label="Resonance (Q)"
              hide-details
              min="0.1"
              max="12"
              step="0.1"
              thumb-label
              :model-value="localFx.filter.q"
              @update:model-value="setFilterQ"
            )
        v-expansion-panel(value="drive")
          v-expansion-panel-title Drive
          v-expansion-panel-text
            v-switch(
              label="Enabled"
              dense
              :model-value="localFx.drive.enabled"
              @update:model-value="toggleDrive"
            )
            v-slider(
              dense
              v-if="localFx.drive.enabled"
              label="Amount"
              hide-details
              min="0"
              max="1"
              step="0.05"
              thumb-label
              :model-value="localFx.drive.amount"
              @update:model-value="setDriveAmount"
            )
        v-expansion-panel(value="reverb")
          v-expansion-panel-title Reverb
          v-expansion-panel-text
            v-switch(
              label="Enabled"
              dense
              :model-value="localFx.reverb.enabled"
              @update:model-value="toggleReverb"
            )
            v-slider(
              dense
              v-if="localFx.reverb.enabled"
              label="Mix"
              hide-details
              min="0"
              max="0.6"
              step="0.02"
              thumb-label
              :model-value="localFx.reverb.mix"
              @update:model-value="setReverbMix"
            )
        v-expansion-panel(value="routing")
          v-expansion-panel-title Routing
          v-expansion-panel-text
            p Subtle master shaping slot. No additional controls yet.
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { FxSettings } from '@/types/audio'

export default defineComponent({
  name: 'FxPanel',
  props: {
    fxSettings: { type: Object as () => FxSettings, required: true }
  },
  emits: ['fx:update'],
  data() {
    return {
      activeSlot: 'filter',
      localFx: { ...this.fxSettings }
    }
  },
  watch: {
    fxSettings: {
      deep: true,
      handler(value: FxSettings) {
        this.localFx = {
          ...value,
          filter: { ...value.filter },
          drive: { ...value.drive },
          reverb: { ...value.reverb }
        }
      }
    }
  },
  methods: {
    emitFx() {
      this.$emit('fx:update', {
        filter: { ...this.localFx.filter },
        drive: { ...this.localFx.drive },
        reverb: { ...this.localFx.reverb }
      })
    },
    toggleFilter(enabled: boolean) {
      this.localFx.filter.enabled = enabled
      this.emitFx()
    },
    setFilterFreq(value: number) {
      this.localFx.filter.frequency = value
      this.emitFx()
    },
    setFilterQ(value: number) {
      this.localFx.filter.q = value
      this.emitFx()
    },
    toggleDrive(enabled: boolean) {
      this.localFx.drive.enabled = enabled
      this.emitFx()
    },
    setDriveAmount(value: number) {
      this.localFx.drive.amount = value
      this.emitFx()
    },
    toggleReverb(enabled: boolean) {
      this.localFx.reverb.enabled = enabled
      this.emitFx()
    },
    setReverbMix(value: number) {
      this.localFx.reverb.mix = value
      this.emitFx()
    }
  }
})
</script>

<style scoped lang="less">
.panel-shell {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: #080b10;
  padding: 12px;
  color: #f5f7fb;

  .panel-header {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.8rem;
    color: #ffc952;
    margin-bottom: 8px;
  }

  .fx-panels {
    background: transparent;
    border: none;

    .v-expansion-panel {
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: border 0.3s ease;

      &:last-child {
        border-bottom: none;
      }
    }

    .v-expansion-panel-title {
      font-weight: 600;
      letter-spacing: 0.3em;
      text-transform: uppercase;
    }

    .v-expansion-panel-text {
      padding: 8px 0 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }
}

.fx-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(720px, 92vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #080b10;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  z-index: 2000;
}


</style>
