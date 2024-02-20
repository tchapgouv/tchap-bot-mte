<template>
  <h1>Tester un Webhooks</h1>
  <dsfr-input v-model="webhook_id"
              :label="'Webhook ID :'"
              :type="'text'"
              :label-visible="true"></dsfr-input>
  <br/>

  <div style="padding-bottom: 2em;">
    <div style="width: 49%; float: left;">

      <dsfr-input v-model="message"
                  :label="'Message :'"
                  :type="'text'"
                  :label-visible="true"
                  :is-textarea="true"
                  rows="10"/>
    </div>
    <div style="width: 49%; float: left; margin-left:2%">

      <dsfr-input :label="'Charge utile (endpoint : /api/webhook/post) :'"
                  :type="'text'"
                  :model-value="
              '{\n' +  
              '   message: &quot;' + message + '&quot;,\n' +
              '   webhook: &quot;' + webhook_id + '&quot;\n' +
              '}'"
                  :label-visible="true"
                  :is-textarea="true"
                  disabled="disabled"
                  rows="10"/>
    </div>
    <div style="clear: both"/>
  </div>

  <dsfr-button :label="'Envoyer'"
               @click="onClick"/>
  <br/>

</template>
<script setup>

import fetchWithError from "@/scripts/fetchWithError";
import {DsfrInput} from "@gouvminint/vue-dsfr";


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