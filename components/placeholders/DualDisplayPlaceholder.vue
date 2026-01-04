<template>
  <div class="dual-display" title="Dual displays with contextual soft labels">
    <div class="display left">
      <div class="display-header">Display L</div>
      <div class="display-body">Status / lists / presets</div>
    </div>
    <div class="display right">
      <div class="display-header">Display R</div>
      <div class="display-body">Params / meters / browser</div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import '@/styles/variables.less';

.dual-display {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: @space-s;
}

.display {
  border-radius: @radius-s;
  background: linear-gradient(180deg, #0f141d, #0b0f16);
  border: 1px solid #2c3545;
  box-shadow:
    inset 0 0 18px rgba(0, 0, 0, 0.65),
    0 8px 28px rgba(0, 0, 0, 0.65);
  color: #9fd4ff;
  min-height: 108px;
  display: flex;
  flex-direction: column;
}

.display-header {
  font-size: @font-size-s;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: @space-xs @space-s;
  color: #cfe9ff;
}

.display-body {
  flex: 1 1 auto;
  padding: @space-s;
  font-size: @font-size-s;
  opacity: 0.9;
  color: #8fc2ff;
}
</style>
