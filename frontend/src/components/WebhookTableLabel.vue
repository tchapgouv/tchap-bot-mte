<script setup>

import fetchWithError from "@/scripts/fetchWithError";

const props = defineProps({
  label: String,
  hasScript: Boolean,
  isInternet: Boolean,
  lastUseEpoch: Number,
  webhook_id: String
})

const loading = ref(true)
const hasError = ref(false)
const errorReason = ref('')
const apiPath = import.meta.env.VITE_API_ENDPOINT
const EXPIRY_DATE = 1000 * 60 * 60 * 24 * 182 // 6 months

onMounted(() => {

  fetchWithError(apiPath + '/api/webhook/check',
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook_id": props.webhook_id,
      })
    }
  )
    .then(stream => stream.json())
    .then(value => {
      loading.value = false
      hasError.value = value.hasError
      errorReason.value = value.reason
    })
})

</script>

<template>
  <p>
    <VIcon v-if="loading"
           style="margin-bottom: -2px"
           scale="1.5"
           color="var(--text-default-grey)"
           title="Vérifications en cours"
           label="Vérifications en cours"
           name="md-rotateright-round"/>
    <VIcon v-if="hasError"
           style="margin-bottom: -2px"
           scale="1.5"
           color="var(--error-425-625)"
           :title="'Erreur (' + errorReason + ')'"
           :label="'Erreur (' + errorReason + ')'"
           name="md-thumbdownoffalt"/>
    <VIcon v-if="props.hasScript"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Avec script custom"
           label="Avec script custom"
           color="var(--warning-425-625)"
           name="px-warning-box"/>
    <VIcon v-if="props.isInternet"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Accessible depuis internet"
           label="Accessible depuis internet"
           color="var(--green-emeraude-sun-425-moon-753)"
           name="gi-biohazard"/>
    <VIcon v-if="Date.now() - props.lastUseEpoch > EXPIRY_DATE"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Inutilisé"
           label="Inutilisé"
           color="var(--text-default-grey)"
           name="gi-dead-wood"/>
    {{ props.label }}
  </p>
</template>