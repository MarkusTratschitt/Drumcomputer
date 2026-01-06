<template lang="pug">
v-card
  v-card-title Sync
  v-card-text
    v-select(:items="modes" v-model="mode" label="Mode")
    v-select(:items="roles" v-model="role" label="Role")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { SyncState } from '~/types/sync'

export default defineComponent({
  name: 'SyncPanel',
  props: {
    syncState: { type: Object as () => SyncState, required: true }
  },
  emits: ['mode', 'role'],
  data() {
    return {
      modes: ['internal', 'midiClock', 'abletonLink'],
      roles: ['master', 'slave'],
      mode: this.syncState.mode,
      role: this.syncState.role
    }
  },
  watch: {
    mode(value: string) {
      this.$emit('mode', value)
    },
    role(value: string) {
      this.$emit('role', value)
    }
  }
})
</script>
