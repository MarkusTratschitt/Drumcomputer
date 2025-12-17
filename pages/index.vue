<template lang="pug">
  client-only
    DrumMachine
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DrumMachine from '~/components/DrumMachine.vue'

export default defineComponent({
  name: 'IndexPage',
  components: { DrumMachine }
})
</script>
