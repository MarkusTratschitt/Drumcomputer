<template>
  <v-app>
    <div class="device-root">
      <div class="device-stage">
        <div class="device-main">
          <slot name="main" />
        </div>

        <div class="device-hardware">
          <div class="device-transport">
            <slot name="transport" />
          </div>

          <div class="device-pads">
            <div class="pads-square">
              <slot name="pads" />
            </div>
          </div>
        </div>
      </div>

      <div class="device-drawer">
        <slot name="drawer" />
      </div>
    </div>
  </v-app>
</template>






<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import PadGrid from '@/components/PadGrid.vue'
import StepGrid from '@/components/StepGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
</script>
