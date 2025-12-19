<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage>
        
      </NuxtPage>
    </NuxtLayout>
  </v-app>
</template>


<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style lang="less">
@import '@/styles/variables.less';

/* app.vue <style lang="less"> */
html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
}

#__nuxt,
.v-application,
.v-application--wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.v-main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.v-application {
  background-color: #121212;
}

</style>
