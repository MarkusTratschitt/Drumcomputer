<template lang="pug">
  client-only(tag="div")
    .panel-shell
      .panel-header Export
      .panel-body
        v-btn(
          color="primary"
          block
          :loading="isExporting"
          :disabled="isExporting"
          @click="$emit('export')"
        ) Export mixdown
        v-alert(
          v-if="exportError"
          type="error"
          dense
          class="mt-2"
        ) {{ exportError }}
        .metadata-grid
          .metadata-row
            span.label Seed
            span.value {{ metadata?.seed ?? '—' }}
          .metadata-row
            span.label BPM
            span.value {{ metadata?.bpm ?? '—' }}
          .metadata-row
            span.label Duration
            span.value {{ formattedDuration }}
          .metadata-row
            span.label Grid
            span.value {{ gridLabel }}
        v-btn(
          color="secondary"
          block
          :disabled="!audioBlob || isExporting"
          class="mt-2"
          @click="$emit('download:mixdown')"
        ) Download WAV
        v-btn(
          color="secondary"
          block
          :disabled="!hasZipArtifacts || isExporting"
          class="mt-2"
          variant="outlined"
          @click="$emit('download:zip')"
        ) Download ZIP bundle
        v-divider(class="my-3")
        .stem-header(v-if="stemEntries.length > 0")
          span Stem exports
          v-btn(text small class="ml-auto" :disabled="isExporting" @click="$emit('download:stems')") Download all
        v-list(v-if="stemEntries.length > 0" density="compact")
          v-list-item(v-for="stem in stemEntries" :key="stem.padId")
            v-list-item-title {{ stem.label }}
            v-list-item-subtitle {{ stem.fileName }}
            template(#append)
              v-btn(text small :disabled="isExporting" @click="$emit('download:stem', stem.padId)") Download
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { DrumPadId } from '@/types/drums'
import type { RenderMetadata } from '@/types/render'

type StemEntry = {
  padId: DrumPadId
  label: string
  fileName: string
}

export default defineComponent({
  name: 'ExportPanel',
  // Panel that triggers audio export and lists metadata plus downloadable mixdown and stems.
  props: {
    isExporting: { type: Boolean, required: true },
    exportError: { type: String, default: null },
    exportMetadata: { type: Object as () => RenderMetadata | null, default: null },
    audioBlob: { type: Object as () => Blob | null, default: null },
    hasZipArtifacts: { type: Boolean, required: true },
    stemEntries: {
      type: Array as () => StemEntry[],
      default: () => []
    }
  },
  emits: ['export', 'download:mixdown', 'download:zip', 'download:stem', 'download:stems'],
  computed: {
    metadata() {
      return this.exportMetadata
    },
    gridLabel(): string {
      const spec = this.exportMetadata?.gridSpec
      if (!spec) return '—'
      return `${spec.bars} bar${spec.bars === 1 ? '' : 's'} • 1/${spec.division}`
    },
    formattedDuration(): string {
      const duration = this.exportMetadata?.durationSec
      if (typeof duration !== 'number') return '—'
      return `${duration.toFixed(2)}s`
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.panel-shell {
  border: 1px solid @color-border-2;
  border-radius: @radius-l;
  background: @color-surface-2;
  padding: 16px;
  color: #f5f7fb;

  .panel-header {
    font-size: 0.9rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #fe9b8b;
    margin-bottom: 10px;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 10px;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.7);
  }

  .metadata-row {
    display: contents;
  }

  .metadata-row .label {
    font-weight: 600;
  }

  .stem-header {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}
</style>
