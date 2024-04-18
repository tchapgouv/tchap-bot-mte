<template>
  <DsfrAlert :title="alerteTitle"
             :description="alerteDescription"
             :type="alerteType"
             :small="true"
             :closeable="true"
             :closed="alerteClosed"
             style="margin-top: 2em;"
             @close="close"/>

  <h1 style="margin-top: 1em;">Webhooks</h1>

  <h4 style="margin-top: 1em;">Générer un Webhook</h4>

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
  <dsfr-button :label="'Générer'"
               @click="onClickGenerate"
               :style="'margin-bottom:25px; margin-top:25px; float: right;'"/>

  <!--  float clear hack  -->
  <div style="clear: both"/>

  <h4>Liste des Webhooks</h4>

  <dsfr-input v-model="filter"
              :label="'filtre :'"
              :type="'text'"
              :label-visible="true"
              :style="'width : 25%;'"/>

  <dsfr-table :headers="['Label', 
              'Webhook', 
              'Room Id', 
              'Bot Id', 
              'Action']"
              :rows="filteredWebhooks"
              v-if="filteredWebhooks.length > 0"/>

  <br/>

  <DsfrModal :opened="modalCopyOpened"
             :is-alert="true"
             :icon="'fr-icon-anchor-fill'"
             :title="modalCopyTitle"
             @close="closeCopyModal"><p style="line-break: anywhere">{{ modalCopyText }}</p>
  </DsfrModal>

  <DsfrModal :opened="modalDeleteOpened"
             :is-alert="true"
             :icon="'fr-icon-anchor-fill'"
             :title="'Suppression d\'un Webhook.'"
             :actions="modalDeleteActions"><p style="line-break: normal">Vous êtes sur le point de supprimer le webhook suivant : <br/>-
                                                                         {{ modalDeleteText }} <br/>Cette action est irréversible.</p>
  </DsfrModal>

</template>

<style>
table {
  display : inline-table !important;
}
</style>

<script setup
        lang="ts">

import {DsfrButton, DsfrButtonGroup, DsfrInput} from "@gouvminint/vue-dsfr";
import fetchWithError from "../scripts/fetchWithError";
import {useRouter} from "vue-router";

const router = useRouter()

const hookLabel = ref('Webhook infra');
const roomId = ref('!pKaqgPaNhBnAvPHjjr:agent.dev-durable.tchap.gouv.fr');
const filter = ref('');
const webhookList = ref([])
const apiPath = import.meta.env.VITE_API_ENDPOINT

const alerteType = ref('error')
const alerteDescription = ref('')
const alerteTitle = ref('')
const alerteClosed = ref(true)

const modalCopyTitle = ref('Webhook :')
const modalCopyText = ref('')
const modalCopyOpened = ref(false)

const modalDeleteText = ref('')
const modalDeleteOpened = ref(false)
const modalDeleteActions = ref([])

declare global {
  const navigator: any;
}

const filteredWebhooks = computed(() => {

  let webhooks: any[] = []
  for (const webhook of webhookList.value) {
    let push = false
    for (const index in webhook) {
      const value: any = webhook[index]
      if (typeof value === 'string') {
        if (value.toLowerCase().includes(filter.value.toLowerCase())) {
          push = true
        }
      }
    }
    if (push) webhooks.push(webhook)
  }

  return webhooks
})


onMounted(() => {
  updateList()
})

function close() {
  alerteClosed.value = !alerteClosed.value
}

function closeCopyModal() {
  modalCopyOpened.value = !modalCopyOpened.value
}

function onClickGenerate() {

  fetchWithError(apiPath + '/api/webhook/create',
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
      // console.log(value)
      // updateList()
      router.push('/webhook/' + value.webhook_id)
    })
}

function hasScript(script: string) {
  if (script === '// Il est possible de manipuler la variable data (le message), qui sera récupérée et envoyée au bot à la fin du traitement.\ndata = data;') return false
  return script !== '';
}

function updateList() {
  fetchWithError(apiPath + '/api/webhook/list',
    {
      method: "GET",
    }
  )
    .then(stream => stream.json())
    .then(value => {
      if (value.map) webhookList.value = value.map(
        (row: WebhookRow) => [
          row.webhook_label.replaceAll(/:.*?($| )/g, "$1") + (hasScript(row.script) ? " (w. script)" : ""),
          {
            component: DsfrButton,
            label: "Copier le webhook",
            onClick: () => copyWebhook("https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + row.webhook_id),
            icon: "ri-file-copy-line"
          },
          row.room_id.replaceAll(/:.*?($| )/g, "$1"),
          row.bot_id.replaceAll(/:.*?($| )/g, "$1"),
          {
            component: DsfrButtonGroup,
            inlineLayoutWhen: "always",
            buttons:
              [
                {
                  label: "Éditer",
                  iconOnly: true,
                  onClick: () => router.push('/webhook/' + row.webhook_id),
                  icon: "fr-icon-edit-line"
                },
                {
                  label: "Tester",
                  iconOnly: true,
                  onClick: () => router.push('/postman/' + row.webhook_id),
                  tertiary: "true",
                  icon: {name: 'ri-flask-line', fill: 'var(--yellow-moutarde-sun-348-moon-860)'}
                }
              ]
          }
        ]);
    })
}

function copyWebhook(webhookId: string) {

  if (navigator.clipboard) {
    navigator.clipboard.writeText(webhookId);
    alerteClosed.value = false
    alerteType.value = "success"
    alerteTitle.value = "Copié"
    alerteDescription.value = "Le webhook a été copié dans le presse papier. (" + webhookId + ")"
  } else {
    modalCopyOpened.value = true
    modalCopyText.value = webhookId
  }
}

interface WebhookRow {
  webhook_id: string
  webhook_label: string
  script: string
  room_id: string
  bot_id: string
}

</script>