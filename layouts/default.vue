<template lang="pug">
  v-app
    .device-root
      .device-stage
        // Main working area
        .device-main
          slot(name="main")

        // Bottom-right hardware corner
        .device-hardware
          .device-transport
            slot(name="transport")

        .device-pads
          .pads-square
            slot(name="pads")

      // Bottom drawer
      .device-drawer
        slot(name="drawer")
</template>


<style scoped lang="less">
@import '@/styles/variables.less';

:deep(.v-application) {
  height: 100%;
}

/* ───────── Root ───────── */

.device-root {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: @color-bg-root;
}

/* ───────── Stage (Main + Hardware) ───────── */

.device-stage {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  gap: @space-m;
  padding: @space-m;
  align-items: stretch;
}

/* ───────── Main Working Area ───────── */

.device-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: @color-surface-1;
  border: 1px solid @color-border-1;
  border-radius: @radius-l;
  padding: @space-m;
  overflow: visible;
}

/* ───────── Hardware Area (rechts) ───────── */

.device-hardware {
  flex: 0 0 auto;
  min-width: 380px;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: @space-m;
}


/* Transport oben */

.device-transport {
  flex: 0 0 260px;
  max-width: 260px;
  min-width: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: @color-surface-1;
  border: 1px solid @color-border-1;
  border-radius: @radius-m;
  padding: @space-s;
}

/* Pads unten rechts */

.device-pads {
  flex: 1 1 auto;
  min-width: 120px;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: @color-surface-2;
  border: 1px solid @color-border-2;
  border-radius: @radius-l;
  overflow: hidden;
}

/* Quadrat erzwingen */
.pads-square {
  width: 100%;
  max-width: 420px; /* Obergrenze für sehr große Screens */
  max-height: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
}

/* ───────── Drawer (unten) ───────── */

.device-drawer {
  flex: 0 0 260px;
  background: @color-surface-3;
  border-top: 1px solid @color-border-1;
  padding: @space-m;
  overflow-y: auto;
}

/* ───────── Responsive: Phone ───────── */

@media (max-width: 768px) {
  .device-stage {
    flex-direction: column;
  }

  .device-hardware {
    flex: 0 0 auto;
    min-width: 0;
  }

  .device-drawer {
    flex: 0 0 40vh;
  }
}
</style>
