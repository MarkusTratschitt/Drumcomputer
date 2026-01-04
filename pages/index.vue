<template lang="pug">
  DrumMachine
    template(#main="{ props }")
      .main-stack
        StepGrid(v-bind="props.stepGridProps")

    template(#pads="{ props }")
      PadGrid(v-bind="props.padGridProps")

    template(#transport="{ props }")
      TransportBar(
        v-bind="props.transportProps"
        v-on="props.transportListeners"
      )

    template(#drawer="{ props }")
      TabPanel(
        :model-value="props.drawerTab"
        @update:model-value="props.onUpdateDrawerTab"
      )
        template(#sound)
          SoundPanel(v-bind="props.soundProps")
        template(#fx)
          FxPanel(v-bind="props.fxProps")
        template(#patterns)
          PatternsPanel(v-bind="props.patternsProps")
        template(#export)
          ExportPanel(v-bind="props.exportProps")
        template(#channel)
          ChannelPanel(v-bind="props.channelProps")
</template>

<script>
import DrumMachine from '@/components/DrumMachine.vue'
import TransportBar from '@/components/TransportBar.vue'
import PadGrid from '@/components/PadGrid.vue'
import StepGrid from '@/components/StepGrid.vue'
import TabPanel from '@/components/TabPanel.vue'
import SoundPanel from '@/components/panels/SoundPanel.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import PatternsPanel from '@/components/panels/PatternsPanel.vue'
import ExportPanel from '@/components/panels/ExportPanel.vue'
import ChannelPanel from '@/components/panels/ChannelPanel.vue'

export default {
  // Restores sequencer surface plus tabbed drawer panels (sound/FX/patterns/export).
  components: {
    DrumMachine,
    TransportBar,
    PadGrid,
    StepGrid,
    TabPanel,
    SoundPanel,
    FxPanel,
    PatternsPanel,
    ExportPanel,
    ChannelPanel
  }
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.main-stack {
  display: flex;
  flex-direction: column;
  gap: @space-s;
  width: 100%;
  height: 100%;
}
</style>
