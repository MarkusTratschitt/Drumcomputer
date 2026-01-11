<template lang="pug">
v-dialog(
  v-model="isOpen"
  max-width="500"
  persistent
)
  v-card
    v-card-title.text-h6 Import to Library
    v-card-text
      .mb-4
        .text-subtitle-2.mb-2 Directory
        .text-body-2.text-grey {{ directoryPath || 'No directory selected' }}
      
      v-checkbox(
        v-model="includeSubfolders"
        label="Include subfolders (recursive)"
        density="compact"
        hide-details
      )
      
      .mt-4
        .text-subtitle-2.mb-2 Default Tags
        v-combobox(
          v-model="tags"
          label="Add tags (comma-separated)"
          multiple
          chips
          closable-chips
          density="compact"
          hint="Press Enter to add tag"
          persistent-hint
        )
    
    v-card-actions
      v-spacer
      v-btn(
        variant="text"
        @click="onCancel"
      ) Cancel
      v-btn(
        color="primary"
        variant="flat"
        @click="onConfirm"
        :disabled="!directoryPath"
      ) Import
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ImportDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    directoryPath: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  data() {
    return {
      includeSubfolders: true,
      tags: [] as string[]
    }
  },
  computed: {
    isOpen: {
      get(): boolean {
        return this.modelValue
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  watch: {
    modelValue(newVal: boolean) {
      if (newVal) {
        this.loadPreferences()
      }
    }
  },
  methods: {
    loadPreferences() {
      if (typeof window === 'undefined' || !window.localStorage) return
      try {
        const stored = window.localStorage.getItem('drumcomputer-import-prefs-v1')
        if (stored) {
          const prefs = JSON.parse(stored)
          this.includeSubfolders = prefs.includeSubfolders ?? true
          this.tags = Array.isArray(prefs.defaultTags) ? [...prefs.defaultTags] : []
        }
      } catch {
        // Use defaults
      }
    },
    savePreferences() {
      if (typeof window === 'undefined' || !window.localStorage) return
      try {
        const prefs = {
          includeSubfolders: this.includeSubfolders,
          defaultTags: this.tags,
          lastImportPath: this.directoryPath
        }
        window.localStorage.setItem('drumcomputer-import-prefs-v1', JSON.stringify(prefs))
      } catch (err) {
        console.warn('Failed to save import preferences:', err)
      }
    },
    onConfirm() {
      this.savePreferences()
      this.$emit('confirm', {
        includeSubfolders: this.includeSubfolders,
        tags: this.tags
      })
      this.isOpen = false
    },
    onCancel() {
      this.$emit('cancel')
      this.isOpen = false
    }
  }
})
</script>
