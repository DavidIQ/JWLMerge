<template>
  <div v-if="log.length" class="log">
    <div v-for="(l, i) in log" :key="i">{{ l }}</div>
  </div>
</template>

<script setup>
import { useMergeUI } from '../composables/useMergeUI'
const { log } = useMergeUI()
</script>

<style scoped>
.log { margin-top:12px; font-family:monospace; font-size:13px; color:#dfe7ff }
</style>
