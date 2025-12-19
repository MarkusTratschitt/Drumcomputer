<template lang="pug">
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
          slot(name="pads")

    // Bottom drawer
    .device-drawer
      slot(name="drawer")
</template>


<script lang="ts">

</script>

<style lang="less">
.device-root {
  height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.device-stage {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.device-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.device-hardware {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px;
}

.device-transport,
.device-pads {
  flex: 0 0 auto;
}

.device-drawer {
  flex: 0 0 auto;
  max-height: 32vh;
  overflow: hidden;
}

/* Phone Mode */
@media (max-width: 768px) {
  .device-stage {
    flex-direction: column;
    overflow-y: auto;
  }

  .device-hardware {
    justify-content: center;
  }
}

</style>