<template lang="pug">
v-app
  v-main
    v-container(fluid)
      DrumMachine
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DrumMachine from '~/components/DrumMachine.vue'

export default defineComponent({
  name: 'App',
  components: { DrumMachine }
})
</script>
