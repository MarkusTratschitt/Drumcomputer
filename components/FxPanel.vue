<template lang="pug">
v-card
  v-card-title FX Chain
  v-card-text
    v-switch(
      label="Filter"
      color="primary"
      :model-value="localFx.filter.enabled"
      @update:model-value="toggleFilter"
    )
    v-slider(
      v-if="localFx.filter.enabled"
      label="Cutoff"
      thumb-label
      min="200"
      max="18000"
      step="50"
      :model-value="localFx.filter.frequency"
      @update:model-value="setFilterFreq"
    )
    v-slider(
      v-if="localFx.filter.enabled"
      label="Resonance (Q)"
      thumb-label
      min="0.1"
      max="12"
      step="0.1"
      :model-value="localFx.filter.q"
      @update:model-value="setFilterQ"
    )
    v-divider(class="my-2")
    v-switch(
      label="Drive"
      color="secondary"
      :model-value="localFx.drive.enabled"
      @update:model-value="toggleDrive"
    )
    v-slider(
      v-if="localFx.drive.enabled"
      label="Amount"
      thumb-label
      min="0"
      max="1"
      step="0.05"
      :model-value="localFx.drive.amount"
      @update:model-value="setDriveAmount"
    )
    v-divider(class="my-2")
    v-switch(
      label="Reverb"
      color="info"
      :model-value="localFx.reverb.enabled"
      @update:model-value="toggleReverb"
    )
    v-slider(
      v-if="localFx.reverb.enabled"
      label="Mix"
      thumb-label
      min="0"
      max="0.6"
      step="0.02"
      :model-value="localFx.reverb.mix"
      @update:model-value="setReverbMix"
    )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { FxSettings } from '~/types/audio'

export default defineComponent({
  name: 'FxPanel',
  props: {
    fxSettings: { type: Object as () => FxSettings, required: true }
  },
  emits: ['fx:update'],
  data() {
    return {
      localFx: { ...this.fxSettings }
    }
  },
  watch: {
    fxSettings: {
      deep: true,
      handler(value: FxSettings) {
        this.localFx = { ...value, filter: { ...value.filter }, drive: { ...value.drive }, reverb: { ...value.reverb } }
      }
    }
  },
  methods: {
    emitFx() {
      this.$emit('fx:update', { ...this.localFx })
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
