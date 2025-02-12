<script setup>

import fetchWithError from "@/scripts/fetchWithError.js";

const props = defineProps({
  label: String,
  hasScript: Boolean,
  isInternet: Boolean,
  lastUseEpoch: Number,
  webhook_id: String
})

const hasError = ref(false)

const EXPIRY_DATE = 1000 * 60 * 60 * 24 * 182 // 6 months

onMounted(() => {
  fetchWithError(apiPath + '/api/webhook/check',
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook_id": webhook_id.value,
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
    <VIcon v-if="props.hasError"
           style="margin-bottom: -2px"
           scale="1.5"
           color="#FF0000"
           name="gi-deadhead"/>
    <VIcon v-if="props.hasScript"
           style="margin-bottom: -2px"
           scale="1.5"
           color="#d64d00"
           name="px-warning-box"/>
    <VIcon v-if="props.isInternet"
           style="margin-bottom: -2px"
           scale="1.5"
           color="#00FF00"
           name="gi-biohazard"/>
    <VIcon v-if="Date.now() - props.lastUseEpoch > EXPIRY_DATE"
           style="margin-bottom: -2px"
           scale="1.5"
           color="#FF7700"
           name="gi-alarmclock"/>
    {{ props.label }}
  </p>
  <style>
    .toto {
    }
  </style>
</template>