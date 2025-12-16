<template lang="pug">
v-card
  v-card-title Soundbanks
  v-card-text
    v-select(
      label="Bank"
      :items="bankItems"
      item-title="title"
      item-value="value"
      :model-value="selectedBankId"
      @update:model-value="onSelectBank"
      hide-details
    )
    v-select(
      class="mt-4"
      label="Pad"
      :items="padItems"
      item-title="title"
      item-value="value"
      v-model="pad"
      hide-details
    )
    input(ref="fileInput" type="file" accept="audio/*" class="d-none" @change="onFileChange")
    v-btn(color="primary" class="mt-3" @click="triggerFile") Replace Sample
    v-list(class="mt-4")
      v-list-item(v-for="bank in banks" :key="bank.id")
        v-list-item-title {{ bank.name }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Soundbank } from '~/types/audio'

export default defineComponent({
  name: 'SoundbankManager',
  props: {
    banks: { type: Array as () => Soundbank[], required: true },
    selectedBankId: { type: String, required: false }
  },
  emits: ['bank:select', 'pad:replace'],
  data() {
    const padItems = Array.from({ length: 16 }).map((_, index) => {
      const id = `pad${index + 1}`
      return { title: id.toUpperCase(), value: id }
    })
    return {
      padItems,
      pad: 'pad1'
    }
  },
  computed: {
    bankItems(): Array<{ title: string; value: string }> {
      return this.banks.map((bank) => ({ title: bank.name, value: bank.id }))
    }
  },
  methods: {
    onSelectBank(value: string) {
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
      this.$emit('pad:replace', { padId: this.pad, file })
      if (input) {
        input.value = ''
      }
    }
  }
})
</script>
