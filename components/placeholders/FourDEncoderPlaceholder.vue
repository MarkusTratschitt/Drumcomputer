<template>
  <div class="encoder" title="4D encoder: tilt ↕↔, turn to browse, press to confirm">
    <div class="encoder-cap">⏺</div>
    <div class="encoder-arrows">↕ ↔</div>
    <div class="encoder-label">Push to confirm</div>
  </div>
</template>

<style scoped lang="less">
@import '@/styles/variables.less';

.encoder {
  align-self: stretch;
  min-width: 120px;
  padding: @space-s @space-m;
  border-radius: @radius-m;
  background: linear-gradient(180deg, #181c26, #0f121a);
  border: 1px solid #2d3542;
  color: @color-text-primary;
  display: grid;
  place-items: center;
  gap: @space-xs;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 4px 12px rgba(0,0,0,0.4);
}

.encoder-cap {
  font-size: 24px;
  color: #f68b1e;
}

.encoder-arrows {
  letter-spacing: 0.25em;
}

.encoder-label {
  font-size: @font-size-xs;
  opacity: 0.85;
}
</style>
