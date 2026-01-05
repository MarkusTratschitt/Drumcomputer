<template>
  <div class="dual-display dual-display-root" :title="`${modeTitle} • ${pageLabel}`">
    <div class="display left">
      <div class="display-header">
        <div class="display-title">{{ modeTitle }}</div>
        <div class="display-subtitle">{{ pageLabel }}</div>
      </div>
      <div class="display-body">
        <div class="panel" :class="panelClass(leftModel)">
          <template v-if="leftModel.view === 'BROWSER'">
            <div class="panel-header">{{ leftModel.title || 'Browser' }}</div>
            <input
              v-model="browserQuery"
              type="search"
              class="browser-search"
              placeholder="Search presets or samples"
              aria-label="Browser search"
            />
            <ul class="item-list">
              <li
                v-for="item in filteredItems(leftModel)"
                :key="item.title"
                :class="{ active: item.active }"
              >
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle">{{ item.subtitle }}</div>
              </li>
            </ul>
          </template>
          <template v-else-if="leftModel.view === 'FILE'">
            <div class="panel-header">{{ leftModel.title || 'Files' }}</div>
            <ul class="item-list">
              <li v-for="item in leftModel.items" :key="item.title">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle">{{ item.subtitle }}</div>
              </li>
            </ul>
            <div v-if="leftModel.summary" class="panel-hint">{{ leftModel.summary }}</div>
          </template>
          <template v-else-if="leftModel.view === 'SAMPLING'">
            <div class="panel-header">{{ leftModel.title || 'Sampling' }}</div>
            <ul class="item-list">
              <li v-for="item in leftModel.items" :key="item.title">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle">{{ item.value || item.subtitle }}</div>
              </li>
            </ul>
            <div v-if="leftModel.summary" class="panel-hint">{{ leftModel.summary }}</div>
          </template>
          <template v-else-if="leftModel.view === 'MIXER' || leftModel.view === 'ARRANGER' || leftModel.view === 'SETTINGS' || leftModel.view === 'INFO'">
            <div class="panel-header">{{ leftModel.title || 'Details' }}</div>
            <ul class="item-list">
              <li v-for="item in leftModel.items" :key="item.title" :class="{ active: item.active }">
                <div class="item-title">
                  {{ item.title }}
                  <span v-if="item.value" class="item-value">{{ item.value }}</span>
                </div>
                <div class="item-subtitle">{{ item.subtitle }}</div>
              </li>
            </ul>
            <div v-if="leftModel.summary" class="panel-hint">{{ leftModel.summary }}</div>
          </template>
          <template v-else>
            <div class="panel-header">{{ leftModel.title || 'Display L' }}</div>
            <div class="panel-hint">{{ leftModel.summary || 'Ready' }}</div>
          </template>
        </div>
        <div class="param-slots">
          <div
            v-for="(param, index) in paramSlotsLeft"
            :key="param.id || index"
            class="param-slot"
          >
            <div class="param-name">{{ param.name }}</div>
            <div class="param-value">{{ formatParam(param.value, param) }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="display right">
      <div class="display-header">
        <div class="display-title">{{ rightModel.title || 'Display R' }}</div>
        <div class="display-subtitle">{{ rightModel.summary || modeTitle }}</div>
      </div>
      <div class="display-body">
        <div class="panel" :class="panelClass(rightModel)">
          <template v-if="rightModel.view === 'BROWSER'">
            <div class="panel-header">{{ rightModel.title || 'Results' }}</div>
            <ul class="item-list">
              <li v-for="item in filteredItems(rightModel)" :key="item.title" :class="{ active: item.active }">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-subtitle">{{ item.subtitle }}</div>
              </li>
            </ul>
            <div v-if="rightModel.summary" class="panel-hint">{{ rightModel.summary }}</div>
          </template>
          <template v-else-if="rightModel.view === 'MIXER' || rightModel.view === 'ARRANGER' || rightModel.view === 'SETTINGS' || rightModel.view === 'INFO' || rightModel.view === 'FILE'">
            <div class="panel-header">{{ rightModel.title || 'Details' }}</div>
            <ul class="item-list">
              <li v-for="item in rightModel.items" :key="item.title" :class="{ active: item.active }">
                <div class="item-title">
                  {{ item.title }}
                  <span v-if="item.value" class="item-value">{{ item.value }}</span>
                </div>
                <div class="item-subtitle">{{ item.subtitle }}</div>
              </li>
            </ul>
            <div v-if="rightModel.summary" class="panel-hint">{{ rightModel.summary }}</div>
          </template>
          <template v-else-if="rightModel.view === 'SAMPLING'">
            <div class="panel-header">{{ rightModel.title || 'Sampling' }}</div>
            <div class="panel-hint">{{ rightModel.summary || 'Set slice or record' }}</div>
          </template>
          <template v-else>
            <div class="panel-header">{{ rightModel.title || 'Display R' }}</div>
            <div class="panel-hint">{{ rightModel.summary || 'Ready' }}</div>
          </template>
        </div>
        <div class="param-slots">
          <div
            v-for="(param, index) in paramSlotsRight"
            :key="param.id || index"
            class="param-slot"
          >
            <div class="param-name">{{ param.name }}</div>
            <div class="param-value">{{ formatParam(param.value, param) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

type ListItem = {
  title: string
  subtitle?: string
  active?: boolean
  value?: string
}

type DisplayPanelModel = {
  view: string
  title?: string
  summary?: string
  items?: ListItem[]
}

type ParamSlot = {
  id: string
  name: string
  value: number
  format?: string
}

export default defineComponent({
  name: 'DualDisplay',
  props: {
    leftModel: {
      type: Object as PropType<DisplayPanelModel>,
      required: true
    },
    rightModel: {
      type: Object as PropType<DisplayPanelModel>,
      required: true
    },
    modeTitle: {
      type: String,
      default: ''
    },
    pageLabel: {
      type: String,
      default: ''
    },
    paramSlotsLeft: {
      type: Array as PropType<ParamSlot[]>,
      default: () => []
    },
    paramSlotsRight: {
      type: Array as PropType<ParamSlot[]>,
      default: () => []
    }
  },
  data() {
    return {
      browserQuery: ''
    }
  },
  methods: {
    formatParam(value: number, param: ParamSlot) {
      if (param.format) {
        return `${value}${param.format}`
      }
      return typeof value === 'number' ? Math.round(value * 100) / 100 : value
    },
    panelClass(model: DisplayPanelModel) {
      return `panel-${(model.view || 'empty').toString().toLowerCase()}`
    },
    filteredItems(model: DisplayPanelModel) {
      if (!model?.items || !Array.isArray(model.items)) return []
      if (!this.browserQuery) return model.items
      const query = this.browserQuery.toLowerCase()
      return model.items.filter((item) => {
        return (
          item.title?.toLowerCase().includes(query) ||
          item.subtitle?.toLowerCase().includes(query)
        )
      })
    }
  }
})
</script>

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
  overflow: hidden;
}

.display-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: @space-xs;
  font-size: @font-size-s;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: @space-xs @space-s;
  color: #cfe9ff;
  border-bottom: 1px solid fade(#cfe9ff, 10%);
}

.display-title {
  font-weight: 600;
}

.display-subtitle {
  font-size: @font-size-xs;
  opacity: 0.8;
}

.display-body {
  flex: 1 1 auto;
  padding: @space-s;
  font-size: @font-size-s;
  opacity: 0.9;
  color: #8fc2ff;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: @space-s;
}

.panel {
  background: linear-gradient(180deg, #131925, #0d111a);
  border: 1px solid #1e2634;
  border-radius: @radius-xs;
  padding: @space-xs;
  box-shadow: inset 0 0 8px rgba(0,0,0,0.35);
}

.panel-header {
  font-size: @font-size-s;
  font-weight: 600;
  margin-bottom: @space-xxs;
}

.panel-hint {
  margin-top: @space-xxs;
  font-size: @font-size-xs;
  color: #b6d5ff;
  opacity: 0.8;
}

.browser-search {
  width: 100%;
  background: #0b1017;
  border: 1px solid #1f2a3a;
  border-radius: @radius-xs;
  padding: @space-xxs @space-xs;
  color: #cfe9ff;
  margin-bottom: @space-xxs;
  font-size: @font-size-s;
}

.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-list li {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.02);
}

.item-list li.active {
  border-color: #3f73ff;
  background: rgba(63, 115, 255, 0.12);
}

.item-title {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #cfe9ff;
}

.item-subtitle {
  font-size: @font-size-xs;
  opacity: 0.8;
}

.item-value {
  font-size: @font-size-xs;
  color: #8fc2ff;
}

.param-slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: @space-xxs;
}

.param-slot {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #1f2a3a;
  border-radius: @radius-xs;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.param-name {
  font-size: @font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #cfe9ff;
}

.param-value {
  font-size: @font-size-s;
  color: #8fc2ff;
}
</style>
