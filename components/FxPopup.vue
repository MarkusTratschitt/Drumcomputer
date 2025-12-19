<template lang="pug">
  client-only(tag="div")
    .fx-popup
      .fx-popup-header
        .fx-title {{ effectLabel }}
        .fx-context {{ contextLabel }}
        button.fx-close(@click="$emit('close')") ✕
      .fx-popup-body
        FxPanel(
          :fx-settings="fxSettings"
          @fx:update="$emit('fx:update', $event)"
        )
</template>

<script lang="ts">

</script>

<style lang="less" scoped>
.fx-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(720px, 92vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: #080b10;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  z-index: 2000;
}

.fx-popup-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .fx-title {
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .fx-context {
    margin-left: auto;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .fx-close {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
  }
}

.fx-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
</style>