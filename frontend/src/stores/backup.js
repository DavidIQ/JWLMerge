import { defineStore } from 'pinia'

export const useBackupStore = defineStore('backup', {
  state: () => ({
    lastReport: null,
    mergedToken: null
  }),
  actions: {
    setReport(r) { this.lastReport = r },
    setToken(t) { this.mergedToken = t }
  }
})

export default useBackupStore
