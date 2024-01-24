<template>
  <h1>Liste des Webhooks</h1>

  <dsfr-input v-model="hookLabel"
              :label="'Webhook Label :'"
              :type="'text'"
              :label-visible="true">test
  </dsfr-input>

  <dsfr-input v-model="roomId"
              :label="'Room ID :'"
              :type="'text'"
              :label-visible="true">test
  </dsfr-input>
  <br/>
  <dsfr-button :label="'Générer'"
               @click="onClick"></dsfr-button>
  <br/>
  <dsfr-table :title="'Webhooks'"
              :headers="['Label', 'Webhook', 'Room Id']"
              :rows="webhookList"/>

</template>
<script setup>
import {DsfrButton, DsfrInput} from "@gouvminint/vue-dsfr";
import fetchWithError from "@/scripts/fetchWithError.js";

const hookLabel = ref('Webhook infra');
const roomId = ref('!pKaqgPaNhBnAvPHjjr:agent.dev-durable.tchap.gouv.fr');
const webhookList = ref([])
const apiPath = import.meta.env.VITE_API_ENDPOINT

onMounted(() => {
  updateList()
})

function onClick () {

  fetchWithError(apiPath + '/create',
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "label": hookLabel.value,
        "room": roomId.value,
      })
    }
  )
    .then(stream => stream.json())
    .then(value => {
      console.log(value)
      updateList()
    })
}

function updateList () {
  fetchWithError(apiPath + '/getall',
    {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
    }
  )
    .then(stream => stream.json())
    .then(value => {
      if (value.map) webhookList.value = value.map(row => [row.webhook_label, row.webhook_id, row.room_id]);
    })

  fetchWithError(apiPath + '/user',
    {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
    }
  )
}

</script>