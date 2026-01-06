<template lang="pug">
v-card
  v-card-title Soundbanks
  v-card-text
    v-list
      v-list-item(v-for="bank in banks" :key="bank.id")
        v-list-item-title {{ bank.name }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Soundbank } from '~/types/audio'

export default defineComponent({
  name: 'SoundbankManager',
  props: {
    banks: { type: Array as () => Soundbank[], required: true }
  }
})
</script>
