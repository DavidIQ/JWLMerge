<template>
  <div class="actions">
    <button @click="inspectLocal" :disabled="!fileA && !fileB">Inspecionar</button>
    <button @click="mergeLocal" :disabled="!fileA || !fileB">Mesclar local</button>
    <button @click="mergeLocalFull('A')" :disabled="!fileA || !fileB">Mesclar tudo no front (A)</button>
    <button @click="detectAndShowConflicts" :disabled="!fileA || !fileB">Detectar conflitos</button>
    <button @click="applyChoicesAndMerge" :disabled="!conflicts.length">Aplicar escolhas e mesclar</button>
    <button @click="downloadMerged" :disabled="!mergedUrl">Baixar merge</button>
  </div>
</template>

<script setup>
import { useMergeUI } from '../composables/useMergeUI'
const { fileA, fileB, mergedUrl, conflicts, inspectLocal, mergeServer, mergeLocal, mergeLocalFull, detectAndShowConflicts, applyChoicesAndMerge, downloadMerged } = useMergeUI()
</script>

<style scoped>
.actions { display:flex; gap:8px; margin-top:12px }
</style>
