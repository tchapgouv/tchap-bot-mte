<template>
  <h1>Tester un Webhook</h1>
  <DsfrInput v-model="webhook_id"
              :label="'Webhook ID :'"
              :type="'text'"
              :label-visible="true"></DsfrInput>
  <br/>

  <div style="padding-bottom: 2em;">
    <div style="width: 49%; float: left;">

      <DsfrInput v-model="message"
                  :label="'Message :'"
                  :type="'text'"
                  :label-visible="true"
                  :is-textarea="true"
                  rows="10"/>
    </div>
    <div style="width: 49%; float: left; margin-left:2%">

      <DsfrInput :label="'Charge utile (endpoint : /api/webhook/post) :'"
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
  <DsfrButton :label="'Envoyer'"
               @click="onClick"/>
  <p style="line-break: anywhere">
    E.g. :
    <br/>
    {{
      'curl -d \'{"message":"' + message.replace("\"", "\\\"").replace("\'", "\'\\\'\'") + '", "webhook":"' + webhook_id + '"}\' -H "Content-Type: application/json" -X POST https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post'
    }}
    <br/>
    ou :
    <br/>
    {{
      'curl -d \'{"message":"' + message.replace("\"", "\\\"").replace("\'", "\'\\\'\'") + '"}\' -H "Content-Type: application/json" -X POST https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/' + webhook_id 
    }} </p>

  <br/>

</template>

<style/>

<script setup
        lang="ts">

import fetchWithError from "../scripts/fetchWithError";
import {DsfrInput} from "@gouvminint/vue-dsfr";

const route = useRoute()

const webhook_id = ref('');
const message = ref('Coucou ! Message envoyé avec un webhook =)');
const apiPath = import.meta.env.VITE_API_ENDPOINT

onMounted(() => {
  webhook_id.value = <string>route.params.webhookId
})

function onClick() {

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