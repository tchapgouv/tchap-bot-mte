import {defineStore} from 'pinia'

export const useWebhookFilterStore = defineStore('webhook-filter', () => {
  const filter = ref("")

  return {filter}
})