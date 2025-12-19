<template>
  <DrumMachine />
</template>

<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
import PadGrid from '@/components/PadGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
import FxPanel from '@/components/panels/FxPanel.vue'

import { definePageMeta } from '#imports'

definePageMeta({
  title: 'Drum Machine',
  layout: false
})
</script>
