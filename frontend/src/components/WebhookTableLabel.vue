<script setup>

import fetchWithError from "@/scripts/fetchWithError";

const props = defineProps({
  label: String,
  hasScript: Boolean,
  isInternet: Boolean,
  lastUseEpoch: Number,
  webhook_id: String
})

const hasError = ref(false)
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
      hasError.value = value.hasError
    })
})

</script>

<template>
  <p>
    <VIcon v-if="hasError"
           style="margin-bottom: -2px"
           scale="1.5"
           color="#FF0000"
           title="Erreur/Error"
           label="Erreur/Error"
           name="gi-dead-head"/>
    <VIcon v-if="Date.now() - props.lastUseEpoch > EXPIRY_DATE"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Vieux/Old"
           label="Vieux/Old"
           color="var(--text-default-grey)"
           name="gi-dead-wood"/>
    <VIcon v-if="props.isInternet"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Accessible depuis internet"
           label="Accessible depuis internet"
           color="#00FF00"
           name="gi-biohazard"/>
    <VIcon v-if="props.hasScript"
           style="margin-bottom: -2px"
           scale="1.5"
           title="Avec script custom"
           label="Avec script custom"
           color="#d64d00"
           name="px-warning-box"/>
    {{ props.label }}
  </p>
</template>