<template>
  <div class="container">
    <header>
      <h1>BACKUP JW - UI (Vue)</h1>
    </header>

    <main>
      <section class="panel">
        <SeletorArquivos />
        <BotoesAcoes />
        <LinkDownload />
        <ConflitosLista />
        <AreaLog />
      </section>
    </main>
  </div>
</template>

<script setup>
import SeletorArquivos from "./SeletorArquivos.vue";
import BotoesAcoes from "./BotoesAcoes.vue";
import LinkDownload from "./LinkDownload.vue";
import ConflitosLista from "./ConflitosLista.vue";
import AreaLog from "./AreaLog.vue";
</script>

<style scoped>
@import "../styles.css";
.row {
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.log {
  margin-top: 12px;
  font-family: monospace;
  font-size: 13px;
  color: #dfe7ff;
}
</style>
