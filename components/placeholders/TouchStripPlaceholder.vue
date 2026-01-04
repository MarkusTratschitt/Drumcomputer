<template>
  <div class="touch-strip" title="Touch strip for performance / pitch / mod">
    <div class="strip-track">
      <div class="strip-indicator" />
    </div>
    <div class="strip-label">Touch Strip ≡</div>
  </div>
</template>

<style scoped lang="less">
@import '@/styles/variables.less';

.touch-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: @space-xs;
  width: 100%;
}

.strip-track {
  width: 20px;
  flex: 1 1 0;
  min-height: 160px;
  border-radius: @radius-m;
  background: linear-gradient(180deg, #1b2130, #0e121b);
  border: 1px solid #2c3443;
  position: relative;
  display: flex;
  align-items: center;
  box-shadow: inset 0 0 12px rgba(0,0,0,0.6);
}

.strip-indicator {
  width: 100%;
  height: 14%;
  border-radius: @radius-s;
  background: fade(#f68b1e, 35%);
  box-shadow: 0 0 10px fade(#f68b1e, 45%);
}

.strip-label {
  font-size: @font-size-xs;
  color: fade(@color-text-secondary, 80%);
}
</style>
