<template>
  <NuxtLayout name="default">
    <template #main>
      <slot name="main" />
    </template>
    <template #transport>
      <slot name="transport" />
    </template>
    <template #pads>
      <slot name="pads" />
    </template>
    <template #drawer>
      <slot name="drawer" />
    </template>
  </NuxtLayout>
</template>

