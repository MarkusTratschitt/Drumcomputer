<template lang="pug">
  client-only(tag="div")
    .panel-shell
      .panel-header Patterns
      .panel-body
        v-row
          v-col(cols="12" md="6")
            v-select(
              label="Current Pattern"
              dense
              :items="patternItems"
              item-title="title"
              item-value="value"
              :model-value="selectedPatternId"
              @update:model-value="handlePatternSelect"
              hide-details
            )
            v-text-field(
              label="Rename Pattern"
              dense
              :model-value="renameValue"
              :placeholder="currentPattern?.name || 'Pattern'"
              @update:model-value="updateRenameValue"
              @change="submitRename"
              hide-details
            )
            v-text-field(
              label="New Pattern Name"
              dense
              :model-value="newPatternName"
              @update:model-value="setNewPatternName"
              hide-details
            )
            v-btn(
              color="primary"
              block
              class="mt-1"
              @click="addPattern"
            ) Add Pattern
            v-row(class="mt-2" dense)
              v-col(cols="6")
                v-btn(
                  color="secondary"
                  block
                  @click="emitPatternUndo"
                ) Undo
              v-col(cols="6")
                v-btn(
                  color="secondary"
                  block
                  variant="outlined"
                  @click="emitPatternRedo"
                ) Redo
          v-col(cols="12" md="6")
            v-select(
              label="Active Scene"
              dense
              :items="sceneItems"
              item-title="title"
              item-value="value"
              :model-value="activeSceneId"
              @update:model-value="selectScene"
              hide-details
              clearable
            )
            v-text-field(
              label="Scene Name"
              dense
              :model-value="sceneName"
              @update:model-value="updateSceneName"
              @change="emitSceneUpdate"
              hide-details
            )
            v-combobox(
              label="Pattern Chain"
              dense
              clearable
              multiple
              chips
              :items="patternItems"
              item-title="title"
              item-value="value"
              :model-value="scenePatternIds"
              @update:model-value="setScenePatternIds"
              hide-details
            )
            v-btn(
              color="secondary"
              block
              class="mt-1"
              @click="addScene"
            ) Add Scene
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Pattern, Scene } from '@/types/drums'

export default defineComponent({
  name: 'PatternsPanel',
  props: {
    patterns: { type: Array as () => Pattern[], required: true },
    selectedPatternId: { type: String, required: false },
    scenes: { type: Array as () => Scene[], required: true },
    activeSceneId: { type: String as () => string | null, default: null }
  },
  emits: ['pattern:add', 'pattern:select', 'pattern:rename', 'pattern:undo', 'pattern:redo', 'scene:add', 'scene:update', 'scene:select'],
  data() {
    return {
      newPatternName: '',
      renameValue: '',
      sceneName: '',
      scenePatternIds: [] as string[]
    }
  },
  computed: {
    patternItems(): Array<{ title: string; value: string }> {
      return this.patterns.map((pattern) => ({ title: pattern.name, value: pattern.id }))
    },
    sceneItems(): Array<{ title: string; value: string | null }> {
      return [{ title: 'None', value: null }, ...this.scenes.map((scene) => ({ title: scene.name, value: scene.id }))]
    },
    currentScene(): Scene | null {
      return this.scenes.find((scene) => scene.id === this.activeSceneId) ?? null
    },
    currentPattern(): Pattern | null {
      return this.patterns.find((pattern) => pattern.id === this.selectedPatternId) ?? null
    }
  },
  watch: {
    currentScene: {
      immediate: true,
      handler(scene: Scene | null) {
        this.sceneName = scene?.name ?? ''
        this.scenePatternIds = [...(scene?.patternIds ?? [])]
      }
    },
    currentPattern: {
      immediate: true,
      handler(pattern: Pattern | null) {
        this.renameValue = pattern?.name ?? ''
      }
    }
  },
  methods: {
    addPattern() {
      this.$emit('pattern:add', { name: this.newPatternName.trim() || undefined })
      this.newPatternName = ''
    },
    handlePatternSelect(id: string | null) {
      if (id) this.$emit('pattern:select', id)
    },
    emitPatternUndo() {
      this.$emit('pattern:undo')
    },
    emitPatternRedo() {
      this.$emit('pattern:redo')
    },
    updateRenameValue(value: string) {
      this.renameValue = value
    },
    setNewPatternName(value: string) {
      this.newPatternName = value
    },
    submitRename() {
      if (this.currentPattern && this.renameValue.trim().length > 0) {
        this.$emit('pattern:rename', { id: this.currentPattern.id, name: this.renameValue.trim() })
      }
    },
    selectScene(id: string | null) {
      this.$emit('scene:select', id)
    },
    updateSceneName(value: string) {
      this.sceneName = value
      this.emitSceneUpdate()
    },
    setScenePatternIds(value: string[]) {
      this.scenePatternIds = value
      this.emitSceneUpdate()
    },
    emitSceneUpdate() {
      if (this.currentScene) {
        this.$emit('scene:update', {
          id: this.currentScene.id,
          name: this.sceneName.trim() || this.currentScene.name,
          patternIds: this.scenePatternIds
        })
      }
    },
    addScene() {
      this.$emit('scene:add', { name: this.sceneName.trim() || 'Scene', patternIds: this.scenePatternIds })
    }
  }
})
</script>

<style scoped lang="less">
.panel-shell {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: #080b10;
  padding: 16px;
  color: #f5f7fb;

  .panel-header {
    font-size: 0.9rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #9d7eff;
    margin-bottom: 12px;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
