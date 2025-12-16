<template lang="pug">
v-card
  v-card-title Patterns & Scenes
  v-card-text
    v-row
    v-col(cols="12" md="6")
      v-select(
        label="Current Pattern"
        :items="patternItems"
        item-title="title"
          item-value="value"
          :model-value="selectedPatternId"
          @update:model-value="selectPattern"
        )
        v-text-field(
          class="mt-2"
          label="Rename Pattern"
          :model-value="renameValue"
          :placeholder="currentPattern?.name || 'Pattern'"
          @update:model-value="onRenameInput"
          @change="emitRename"
        )
        v-text-field(class="mt-4" label="New Pattern Name" v-model="newPatternName")
        v-btn(color="primary" class="mt-2" @click="addPattern") Add Pattern
        v-row(class="mt-2" dense)
          v-col(cols="6")
            v-btn(block color="secondary" @click="$emit('pattern:undo')") Undo
          v-col(cols="6")
            v-btn(block color="secondary" variant="outlined" @click="$emit('pattern:redo')") Redo
      v-col(cols="12" md="6")
        v-select(
          label="Active Scene"
          :items="sceneItems"
          item-title="title"
          item-value="value"
          :model-value="activeSceneId"
          @update:model-value="selectScene"
          clearable
        )
        v-text-field(class="mt-2" label="Scene Name" v-model="sceneName" @change="emitSceneUpdate")
        v-combobox(
          class="mt-2"
          chips
          multiple
          clearable
          label="Pattern Chain (order matters)"
          :items="patternItems"
          item-title="title"
          item-value="value"
          v-model="scenePatternIds"
          @update:model-value="updateScenePatterns"
        )
        v-btn(color="secondary" class="mt-2" @click="addScene") Add Scene
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { Pattern, Scene } from '~/types/drums'

export default defineComponent({
  name: 'PatternScenePanel',
  props: {
    patterns: { type: Array as () => Pattern[], required: true },
    selectedPatternId: { type: String, required: true },
    scenes: { type: Array as () => Scene[], required: true },
    activeSceneId: { type: String, default: null }
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
      return [{ title: 'None', value: null }, ...this.scenes.map((scene) => ({ title: scene.name, value: scene.id })) ]
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
    selectPattern(id: string | null) {
      if (id) {
        this.$emit('pattern:select', id)
      }
    },
    onRenameInput(value: string) {
      this.renameValue = value
    },
    emitRename() {
      if (this.currentPattern && this.renameValue.trim().length > 0) {
        this.$emit('pattern:rename', { id: this.currentPattern.id, name: this.renameValue.trim() })
      }
    },
    addScene() {
      this.$emit('scene:add', { name: this.sceneName.trim() || 'Scene', patternIds: this.scenePatternIds })
    },
    selectScene(id: string | null) {
      this.$emit('scene:select', id)
    },
    emitSceneUpdate() {
      if (this.currentScene) {
        this.$emit('scene:update', { id: this.currentScene.id, name: this.sceneName.trim(), patternIds: this.scenePatternIds })
      }
    },
    updateScenePatterns(value: string[]) {
      this.scenePatternIds = value
      this.emitSceneUpdate()
    }
  }
})
</script>
