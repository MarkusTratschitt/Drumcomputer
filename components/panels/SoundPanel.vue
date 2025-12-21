<template lang="pug">
  client-only(tag="div")
    .panel-shell
      .panel-header Sound
      .panel-body
        v-select(
          label="Bank"
          dense
          :items="bankItems"
          item-title="title"
          item-value="value"
          :model-value="selectedBankId"
          @update:model-value="selectBank"
          hide-details
        )
        v-select(
          label="Pad"
          dense
          :items="padItems"
          item-title="title"
          item-value="value"
          v-model="padTarget"
          hide-details
        )
        p.current-sample Label: {{ currentSampleLabel }}
        input(
          ref="fileInput"
          type="file"
          accept="audio/*"
          class="d-none"
          @change="onFileChange"
        )
        v-btn(color="primary" class="mt-3" block @click="triggerFile") Replace sample
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Soundbank } from '@/types/audio'
import type { DrumPadId } from '@/types/drums'

export default defineComponent({
  name: 'SoundPanel',
  props: {
    banks: { type: Array as () => Soundbank[], required: true },
    selectedBankId: { type: String, default: null }
  },
  emits: ['bank:select', 'pad:replace'],
  data() {
    return {
      padTarget: 'pad1' as DrumPadId
    }
  },
  computed: {
    bankItems(): Array<{ title: string; value: string }> {
      return this.banks.map((bank) => ({ title: bank.name, value: bank.id }))
    },
    padItems(): Array<{ title: string; value: DrumPadId }> {
      return Array.from({ length: 16 }, (_, index) => {
        const id = `pad${index + 1}` as DrumPadId
        return { title: id.toUpperCase(), value: id }
      })
    },
    currentSampleLabel(): string {
      const bank = this.banks.find((entry) => entry.id === this.selectedBankId)
      const sample = bank?.pads?.[this.padTarget]
      return sample?.name ?? 'Default'
    }
  },
  methods: {
    selectBank(value: string) {
      this.$emit('bank:select', value)
    },
    triggerFile() {
      const input = this.$refs.fileInput as HTMLInputElement | undefined
      input?.click()
    },
    onFileChange(event: Event) {
      const input = event.target as HTMLInputElement | null
      const files = input?.files
      if (!files || files.length === 0) return
      const file = files[0]
      this.$emit('pad:replace', { padId: this.padTarget, file })
      if (input) {
        input.value = ''
      }
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.panel-shell {
  border: 1px solid @color-border-2;
  border-radius: @radius-l;
  background: @color-surface-2;
  padding: 16px;
  color: #f5f7fb;

  .panel-header {
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 12px;
    color: #62e3ff;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .current-sample {
    font-size: 0.75rem;
    opacity: 0.85;
    letter-spacing: 0.08em;
  }
}
</style>
