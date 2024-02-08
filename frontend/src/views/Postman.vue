<template>
  <h1>Tester un Webhooks</h1>
  <dsfr-input v-model="webhook_id"
              :label="'Webhook ID :'"
              :type="'text'"
              :label-visible="true"></dsfr-input>
  <br/>
  <dsfr-input v-model="message"
              :label="'Message :'"
              :type="'text'"
              :label-visible="true"></dsfr-input>

  <br/>

  <dsfr-button :label="'Envoyer'"
               @click="onClick"></dsfr-button>
  <br/>

</template>
<script setup>

import fetchWithError from "@/scripts/fetchWithError";


const webhook_id = ref('');
const message = ref('Coucou ! Message envoyé avec un webhook =)');
const apiPath = import.meta.env.VITE_API_ENDPOINT

function onClick () {

  // console.log(apiPath)
  
  fetchWithError(apiPath + '/api/webhook/post',
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook": webhook_id.value,
        "message": message.value,
      })
    }
  )
    .then(stream => stream.json())
    .then(_value => {
      // console.log(value)
    }).catch(e => console.error(e))
}

</script>