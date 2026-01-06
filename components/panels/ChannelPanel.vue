<template lang="pug">
  client-only(tag="div")
    .panel-shell
      .panel-header Channel & MIDI
      .panel-body
        v-select(
          label="Control target"
          dense
          :items="controlTargets"
          item-title="title"
          item-value="value"
          :model-value="controlTarget"
          @update:model-value="$emit('update:control-target', $event)"
          hide-details
        )
        v-switch(
          label="MIDI Mode (Shift+Channel)"
          dense
          :model-value="midiMode"
          @update:model-value="$emit('update:midi-mode', $event)"
        )
        p.helper Soft labels/knobs are contextual; this panel is a stub for Channel Properties.
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const controlTargets = [
  { title: 'Sound', value: 'sound' },
  { title: 'Group', value: 'group' },
  { title: 'Master', value: 'master' }
]

export default defineComponent({
  name: 'ChannelPanel',
  props: {
    controlTarget: { type: String, default: 'sound' },
    midiMode: { type: Boolean, default: false }
  },
  emits: ['update:control-target', 'update:midi-mode'],
  computed: {
    controlTargets() {
      return controlTargets
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
    color: #8bd1ff;
    margin-bottom: 12px;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .helper {
    font-size: 0.75rem;
    opacity: 0.8;
    letter-spacing: 0.06em;
  }
}
</style>
