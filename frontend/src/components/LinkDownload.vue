<template>
  <div v-if="mergedUrl" style="margin-top:10px">
    <a :href="mergedUrl" :download="downloadName || ''">Abrir/baixar arquivo de merge</a>
  </div>
</template>

<script setup>
import { useMergeUI } from '../composables/useMergeUI'
const { mergedUrl, downloadName } = useMergeUI()
</script>
