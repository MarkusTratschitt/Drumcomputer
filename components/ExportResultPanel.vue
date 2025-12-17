<template lang="pug">
v-card
  v-card-title Export metadata
  v-card-text
    dl.export-metadata
      dt Seed
      dd {{ metadata.seed }}
      dt BPM
      dd {{ metadata.bpm }}
      dt Duration
      dd {{ formatSeconds(metadata.durationSec) }}
      dt Grid spec
      dd {{ gridSpecLabel }}
      dt Scene
      dd {{ metadata.sceneId ?? '—' }}
      dt Pattern chain
      dd {{ patternChainLabel }}
      dt Event count
      dd {{ eventCountLabel }}
    v-divider(v-if="hasTimeline" class="my-3")
    div.timeline-summary(v-if="hasTimeline")
      p.mb-1 Timeline ({{ debugTimeline ? debugTimeline.length : 0 }} events):
      p.text-caption First {{ formatSeconds(firstEventTime) }}, last {{ formatSeconds(lastEventTime) }}
      v-simple-table(dense)
        thead
          tr
            th Time
            th Pad
            th Velocity
        tbody
          tr(v-for="(event, index) in timelinePreview" :key="`${event.padId}-${event.time}-${index}`")
            td {{ formatSeconds(event.time) }}
            td {{ event.padId }}
            td {{ event.velocity.toFixed(2) }}
  v-card-actions
    v-btn(color="primary" :disabled="!audioBlob" @click="downloadWav") Download WAV
    v-btn(color="secondary" @click="downloadMeta") Download JSON
    v-spacer
    v-btn(text small @click="copySeed") Copy seed
    span.text-caption.ml-2(v-if="seedCopyFeedback") {{ seedCopyFeedback }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { saveAs } from 'file-saver'
import type { RenderEvent, RenderMetadata } from '~/types/render'

export default defineComponent({
  name: 'ExportResultPanel',
  props: {
    metadata: { type: Object as () => RenderMetadata, required: true },
    audioBlob: { type: Object as () => Blob | null, required: false, default: null },
    debugTimeline: { type: Array as () => RenderEvent[] | undefined, required: false }
  },
  data() {
    return {
      seedCopyFeedback: null as string | null,
      copyTimer: null as ReturnType<typeof setTimeout> | null
    }
  },
  computed: {
    gridSpecLabel(): string {
      const spec = this.metadata.gridSpec
      return `${spec.bars} bar${spec.bars === 1 ? '' : 's'} • division ${spec.division}`
    },
    patternChainLabel(): string {
      return this.metadata.patternChain.join(' → ')
    },
    eventCountLabel(): string {
      if (!this.debugTimeline) return 'N/A'
      return String(this.debugTimeline.length)
    },
    metaBlob(): Blob {
      return new Blob([JSON.stringify(this.metadata, null, 2)], { type: 'application/json' })
    },
    hasTimeline(): boolean {
      return this.devMode && Boolean(this.debugTimeline && this.debugTimeline.length > 0)
    },
    timelinePreview(): RenderEvent[] {
      return (this.debugTimeline ?? []).slice(0, 20)
    },
    firstEventTime(): number | null {
      return this.debugTimeline?.[0]?.time ?? null
    },
    lastEventTime(): number | null {
      const events = this.debugTimeline ?? []
      return events.length ? events[events.length - 1].time : null
    },
    devMode(): boolean {
      return typeof process !== 'undefined' && Boolean(process.dev)
    }
  },
  methods: {
    downloadWav() {
      if (!this.audioBlob) return
      saveAs(this.audioBlob, 'mixdown.wav')
    },
    downloadMeta() {
      saveAs(this.metaBlob, 'render-meta.json')
    },
    async copySeed() {
      const seed = this.metadata.seed
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(seed)
          this.setCopyFeedback('Seed copied')
          return
        }
        if (typeof document === 'undefined') {
          this.setCopyFeedback('Clipboard unavailable')
          return
        }
        const textarea = document.createElement('textarea')
        textarea.value = seed
        textarea.setAttribute('readonly', 'readonly')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.setCopyFeedback('Seed copied')
      } catch (error) {
        console.error('Failed to copy seed', error)
        this.setCopyFeedback('Copy failed')
      }
    },
    setCopyFeedback(message: string) {
      this.seedCopyFeedback = message
      if (this.copyTimer) {
        clearTimeout(this.copyTimer)
      }
      this.copyTimer = setTimeout(() => {
        this.seedCopyFeedback = null
        this.copyTimer = null
      }, 2000)
    },
    formatSeconds(value: number | null): string {
      if (typeof value !== 'number') {
        return '—'
      }
      return `${value.toFixed(2)}s`
    }
  },
  beforeUnmount() {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer)
    }
  }
})
</script>
