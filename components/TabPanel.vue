<template lang="pug">
.drawer-shell
  v-tabs(
    v-model="internalTab"
    density="comfortable"
    variant="text"
    class="drawer-tabs"
  )
    v-tab(v-for="tab in tabs" :key="tab.value" :value="tab.value") {{ tab.label }}
  v-tabs-window(v-model="internalTab" class="drawer-window")
    v-tabs-window-item(value="sound")
      slot(name="sound")
    v-tabs-window-item(value="fx")
      slot(name="fx")
    v-tabs-window-item(value="patterns")
      slot(name="patterns")
    v-tabs-window-item(value="export")
      slot(name="export")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const tabs = [
  { label: 'Sound', value: 'sound' },
  { label: 'FX', value: 'fx' },
  { label: 'Patterns', value: 'patterns' },
  { label: 'Export', value: 'export' }
]

export default defineComponent({
  name: 'TabPanel',
  props: {
    modelValue: { type: String, default: 'sound' }
  },
  emits: ['update:modelValue'],
  computed: {
    internalTab: {
      get(): string {
        return this.modelValue
      },
      set(value: string) {
        this.$emit('update:modelValue', value)
      }
    },
    tabs() {
      return tabs
    }
  }
})
</script>

<style scoped lang="less">
.drawer-shell {
  margin-top: 24px;
  border-radius: 20px;
  background: #07090f;
  border: 1px solid #1f2433;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;

  .drawer-tabs {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: #0b0f16;
    flex: 0 0 56px;
  }

  .drawer-window {
    background: #05060b;
    border-radius: 0 0 16px 16px;
    padding: 16px;
    flex: 1 1 auto;
    overflow-y: auto;
    max-height: calc(100% - 56px);
  }
}

@media (max-height: 780px) {
  .drawer-shell {
    margin-top: 16px;
  }
}
</style>
