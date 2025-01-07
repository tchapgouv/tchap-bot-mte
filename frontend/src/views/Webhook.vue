<template>
  <DsfrAlert :title="alerteTitle"
             :description="alerteDescription"
             :type="alerteType"
             :small="true"
             :closeable="true"
             :closed="alerteClosed"
             style="margin-top: 2em;"
             @close="close"/>

  <h1 style="margin-top: 1em;">Modifier un Webhook</h1>

  <dsfr-input v-model="webhook.label"
              :label="'Webhook Label :'"
              :type="'text'"
              :label-visible="true"/>

  <dsfr-input v-model="webhook.roomId"
              :label="'Room ID :'"
              :type="'text'"
              :label-visible="true"/>

  <dsfr-input v-model="webhook.botId"
              :label="'Bot User ID :'"
              :type="'text'"
              :label-visible="true"/>

  <dsfr-input v-model="webhook.id"
              :label="'Webhook ID :'"
              :type="'text'"
              :label-visible="true"
              disabled="disabled"/>

  <dsfr-input v-model="webhook.script"
              :label="'Webhook script :'"
              :type="'text'"
              :label-visible="true"
              :is-textarea="true"
              rows="10"/>

  <br/>

  <span style="display: inline-block"
        class="custom-checkbox">
      <DsfrCheckbox v-model="webhook.internet"
                    :label="'Accessible depuis internet.'"
                    name="checkbox-simple"/>
      <v-icon scale="1"
              color="#00FF00"
              name="gi-biohazard"/>
    </span>

  <br/>

  <DsfrModal :opened="modalDeleteOpened"
             :is-alert="true"
             :icon="'fr-icon-anchor-fill'"
             :title="'Suppression d\'un Webhook.'"
             @close="cancelDeleteWebhook"
             :actions="modalDeleteActions"><p style="line-break: normal">Vous êtes sur le point de supprimer le webhook suivant : <br/>-
                                                                         {{ modalDeleteText }} <br/>Cette action est irréversible.</p>
  </DsfrModal>

  <dsfr-button-group :inlineLayoutWhen="true">
    <dsfr-button :label="'Retour'"
                 :icon="'ri-arrow-go-back-line'"
                 @click="returnToWebhookList"
                 :tertiary="true"/>
    <dsfr-button :label="'Enregistrer'"
                 :icon="'ri-save-line'"
                 @click="saveWebhook"/>
    <dsfr-button :label="'Supprimer'"
                 :icon="{name: 'ri-delete-bin-line', fill: 'var(--red-marianne-main-472)'}"
                 @click="confirmDeleteWebhook"/>
    <dsfr-button :label="'Tester'"
                 :icon="{name: 'ri-flask-line', fill: 'var(--yellow-moutarde-sun-348-moon-860)'}"
                 @click="router.push('/postman/' + webhook.id)"/>
  </dsfr-button-group>
</template>

<style>
table {
  display : inline-table !important;
}

.custom-checkbox .fr-fieldset__element {
  display : inherit;
}
</style>

<script setup
        lang="ts">

import {DsfrButton, DsfrInput} from "@gouvminint/vue-dsfr";
import fetchWithError from "../scripts/fetchWithError";

const router = useRouter()
const route = useRoute()

const apiPath = import.meta.env.VITE_API_ENDPOINT

const alerteType = ref('error')
const alerteDescription = ref('')
const alerteTitle = ref('')
const alerteClosed = ref(true)

const modalDeleteText = ref('')
const modalDeleteOpened = ref(false)
const modalDeleteActions: Ref<any[]> = ref([])

const webhook = ref({
  label: '',
  roomId: '',
  botId: '',
  internet: false,
  id: '',
  script: ''
})

onMounted(() => {
  getWebhook(<string>route.params.webhookId)
})

function getWebhook(webhookId: string) {

  fetchWithError(apiPath + '/api/webhook/get',
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook": webhookId,
      })
    }
  )
    .then(stream => stream.json())
    .then(value => {
      // console.log(value)
      webhook.value.label = value.webhook_label
      webhook.value.roomId = value.room_id
      webhook.value.botId = value.bot_id
      webhook.value.internet = value.internet
      webhook.value.id = value.webhook_id
      webhook.value.script = value.script
    })
}

function close() {
  alerteClosed.value = !alerteClosed.value
}

function returnToWebhookList() {
  router.push("/webhooks")
}

function cancelDeleteWebhook() {
  modalDeleteOpened.value = false
  modalDeleteText.value = ''
  modalDeleteActions.value = []
}

function confirmDeleteWebhook() {
  modalDeleteText.value = webhook.value.label
  modalDeleteOpened.value = true
  modalDeleteActions.value = [
    {
      "label": "Confirmer",
      onClick: () => deleteWebhook(webhook.value.id)
    },
    {
      "label": "Annuler",
      onClick: () => cancelDeleteWebhook(),
      "secondary": true
    }
  ]
}

function deleteWebhook(webhookId: string) {
  fetchWithError(apiPath + '/api/webhook/delete/',
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook": webhookId,
      })
    }
  ).then(stream => stream.json())
    .then(value => {
      // console.log(value.message)

      if (value.message) {
        alerteClosed.value = false
        alerteType.value = value.message.type
        alerteTitle.value = value.message.title
        alerteDescription.value = value.message.description
      }

      cancelDeleteWebhook()

      router.push("/webhooks")
    })
}

function saveWebhook() {
  fetchWithError(apiPath + '/api/webhook/update',
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook": {
          'webhook_label': webhook.value.label,
          'webhook_id': webhook.value.id,
          'room_id': webhook.value.roomId,
          'bot_id': webhook.value.botId,
          'internet': webhook.value.internet,
          'script': webhook.value.script,
        },
      })
    }
  ).then(stream => stream.json())
    .then(value => {
      // console.log(value.message)

      if (value.message) {
        alerteClosed.value = false
        alerteType.value = value.message.type
        alerteTitle.value = value.message.title
        alerteDescription.value = value.message.description
      }

      cancelDeleteWebhook()
    })
}

</script>