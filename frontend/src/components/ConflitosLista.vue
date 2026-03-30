<template>
  <div v-if="conflicts.length" style="margin-top:14px">
    <h3>Conflitos detectados ({{ conflicts.length }})</h3>
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
      <label>Filtrar por tabela:</label>
      <select v-model="tableFilter">
        <option value="">(todas)</option>
        <option v-for="t in tablesAvailable" :key="t" :value="t">{{ t }}</option>
      </select>
      <label style="margin-left:12px">Por página:</label>
      <select v-model.number="perPage">
        <option :value="6">6</option>
        <option :value="12">12</option>
        <option :value="24">24</option>
      </select>
      <div style="margin-left:auto; display:flex; gap:8px">
        <button @click.prevent="pickAll('A')">Manter A para todos</button>
        <button @click.prevent="pickAll('B')">Manter B para todos</button>
      </div>
    </div>

    <div v-for="(c, i) in pagedConflicts" :key="c.table + '::' + c.key" style="margin-bottom:10px; padding:8px; background:#0b1220; border-radius:6px">
      <div><strong>{{ c.table }}</strong> — {{ c.keyCol }}={{ c.key }}</div>
      <div style="display:flex; gap:8px; margin-top:6px">
        <div style="flex:1">
          <div style="font-size:12px; color:#9fd">A (diferenças abaixo):</div>
          <pre style="white-space:pre-wrap; font-size:12px">{{ formatDiffValues(c.a, diffKeys(c)) }}</pre>
        </div>
        <div style="flex:1">
          <div style="font-size:12px; color:#f9b">B (diferenças abaixo):</div>
          <pre style="white-space:pre-wrap; font-size:12px">{{ formatDiffValues(c.b, diffKeys(c)) }}</pre>
        </div>
      </div>
      <div style="margin-top:8px; display:flex; gap:8px">
        <button @click.prevent="pickChoiceByIndex((page-1)*perPage + i, 'A')">Manter A</button>
        <button @click.prevent="pickChoiceByIndex((page-1)*perPage + i, 'B')">Manter B</button>
      </div>
    </div>

    <div style="display:flex; gap:8px; align-items:center; margin-top:8px">
      <button @click.prevent="prevPage" :disabled="page<=1">Prev</button>
      <div>Página {{ page }} / {{ totalPages }}</div>
      <button @click.prevent="nextPage" :disabled="page>=totalPages">Next</button>
    </div>
  </div>
</template>

<script setup>
import { useMergeUI } from '../composables/useMergeUI'
const { conflicts, tableFilter, tablesAvailable, perPage, pickAll, pagedConflicts, formatDiffValues, diffKeys, pickChoiceByIndex, page, totalPages, prevPage, nextPage } = useMergeUI()
</script>
