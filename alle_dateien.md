# Dateien mit <style>-Block

- app.vue
- components/DrumMachine.vue
- components/PadCell.vue
- components/PadGrid.vue
- components/PlayheadOverlay.vue
- components/StepGrid.vue
- components/TabPanel.vue
- components/TransportBar.vue
- components/panels/ExportPanel.vue
- components/panels/FxPanel.vue
- components/panels/PatternsPanel.vue
- components/panels/SoundPanel.vue
- layouts/default.vue


  div(style="color:white; padding:20px;")
  .drumshell
    // ───────────── TOP ─────────────
    .hardware-top
      TransportBar(
        :bpm="bpm"
        :isPlaying="isPlaying"
        :loop="transport.loop"
        :division="gridSpec.division"
        :divisions="divisions"
        @play="start"
        @stop="stop"
        @bpm:update="updateBpm"
        @loop:update="setLoop"
        @division:update="setDivision"
      )

    // ───────────── MAIN ─────────────
    .main-shell
      .pads-panel
        PadGrid(
          :pads="pads"
          :selected-pad="selectedPadId"
          :pad-states="padStates"
          @pad:down="handlePad"
          @pad:select="selectPad"
        )

      .sequencer-panel
        StepGrid(
          :grid-spec="gridSpec"
          :steps="pattern.steps"
          :selected-pad="selectedPadId"
          :current-step="currentStep"
          :is-playing="isPlaying"
          @step:toggle="toggleStep"
        )

    // ───────────── DRAWER ─────────────
    .drawer-wrapper
      .drawer-scroll
        TabPanel(v-model="drawerTab")
          template(#sound)
            SoundPanel(
              :banks="banks"
              :selected-bank-id="soundbanks.selectedBankId"
              @bank:select="selectBank"
              @pad:replace="replacePadSample"
            )

          template(#fx)
            FxPanel(
              :fxSettings="sequencer.fxSettings"
              @fx:update="updateFx"
            )

          template(#patterns)
            PatternsPanel(
              :patterns="patterns.patterns"
              :selected-pattern-id="patterns.selectedPatternId"
              :scenes="patterns.scenes"
              :active-scene-id="patterns.activeSceneId"
              @pattern:add="addPattern"
              @pattern:select="selectPattern"
              @pattern:rename="renamePattern"
              @pattern:undo="undoPattern"
              @pattern:redo="redoPattern"
              @scene:add="addScene"
              @scene:update="updateScene"
              @scene:select="selectScene"
            )

          template(#export)
            ExportPanel(
              :isExporting="isExporting"
              :exportError="exportError"
              :exportMetadata="exportMetadata"
              :audioBlob="exportAudioBlob"
              :hasZipArtifacts="hasZipArtifacts"
              :stemEntries="stemEntries"
              @export="exportBounce"
              @download:mixdown="downloadMixdown"
              @download:zip="downloadZip"
              @download:stem="downloadStem"
              @download:stems="downloadAllStems"
            )
