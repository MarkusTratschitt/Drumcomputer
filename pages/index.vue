<template>
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
</template>






