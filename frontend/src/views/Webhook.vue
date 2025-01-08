<template>
  <div class="fr-container">
    
    <div class="fr-grid-row fr-mb-3w fr-grid-row--center">
      <DsfrAlert :title="alerteTitle"
                 :description="alerteDescription"
                 :type="alerteType"
                 :small="true"
                 :closeable="true"
                 :closed="alerteClosed"
                 style="margin-top: 2em;"
                 @close="close"/>
    </div>

    <h1 style="margin-top: 1em;">Modifier un Webhook</h1>

    <div class="fr-grid-row fr-mb-3w">
      <DsfrInput v-model="webhook.label"
                 :label="'Webhook Label :'"
                 :type="'text'"
                 :label-visible="true"/>
    </div>
    
    <div class="fr-grid-row fr-mb-3w">
      <DsfrInput v-model="webhook.roomId"
                 :label="'Room ID :'"
                 :type="'text'"
                 :label-visible="true"/>
    </div>
    
    <div class="fr-grid-row fr-mb-3w">
      <DsfrInput v-model="webhook.botId"
                 :label="'Bot User ID :'"
                 :type="'text'"
                 :label-visible="true"/>
    </div>
    
    <div class="fr-grid-row fr-mb-3w">
      <DsfrInput v-model="webhook.id"
                 :label="'Webhook ID :'"
                 :type="'text'"
                 :label-visible="true"
                 disabled="disabled"/>
    </div>
    
    <div class="fr-grid-row fr-mb-3w">
      <DsfrInput v-model="webhook.script"
                 :type="'text'"
                 label-visible
                 :is-textarea="true"
                 rows="10">

        <template #label>
          <VIcon scale="1"
                 color="#d64d00"
                 name="px-warning-box"
                 style="margin-right: 5px;"/>
          Webhook script :
        </template>
      </DsfrInput>
    </div>
    
    <div class="fr-grid-row fr-mb-8w">
      <DsfrCheckbox v-model="webhook.internet"
                    name="checkbox-simple">
        <template #label>
          <VIcon scale="1"
                 color="#00FF00"
                 name="gi-biohazard"
                 style="margin-right: 5px;"/>
          Accessible depuis internet
        </template>
      </DsfrCheckbox>
    </div>

    <DsfrModal :opened="modalDeleteOpened"
               :is-alert="true"
               :icon="'fr-icon-anchor-fill'"
               :title="'Suppression d\'un Webhook.'"
               @close="cancelDeleteWebhook"
               :actions="modalDeleteActions"><p style="line-break: normal">Vous êtes sur le point de supprimer le webhook suivant : <br/>-
                                                                           {{ modalDeleteText }} <br/>Cette action est irréversible.</p>
    </DsfrModal>

    <DsfrButtonGroup :inlineLayoutWhen="true">
      <DsfrButton :label="'Retour'"
                  :icon="'ri-arrow-go-back-line'"
                  @click="returnToWebhookList"
                  :tertiary="true"/>
      <DsfrButton :label="'Enregistrer'"
                  :icon="'ri-save-line'"
                  @click="saveWebhook"/>
      <DsfrButton :label="'Supprimer'"
                  :icon="{name: 'ri-delete-bin-line', fill: 'var(--red-marianne-main-472)'}"
                  @click="confirmDeleteWebhook"/>
      <DsfrButton :label="'Tester'"
                  :icon="{name: 'ri-flask-line', fill: 'var(--yellow-moutarde-sun-348-moon-860)'}"
                  @click="router.push('/postman/' + webhook.id)"/>
    </DsfrButtonGroup>
  </div>
</template>

<style>
table {
  display : inline-table !important;
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