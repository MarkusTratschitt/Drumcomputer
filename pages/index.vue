<template>
  <NuxtLayout name="default">
    <template #main>
      <DrumMachine />
    </template>
    <template #transport>
      <div />
    </template>
    <template #pads>
      <div />
    </template>
    <template #drawer>
      <div />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
</script>
