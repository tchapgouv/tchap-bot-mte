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
  <br/>
  <dsfr-button :label="'Générer'"
               @click="onClickGenerate"></dsfr-button>
  <dsfr-table :title="'Liste des Webhooks'"
              :headers="['Label', 'Webhook', 'Room Id', 'Action']"
              :rows="webhookList"
              v-if="webhookList.length > 0"
  style="margin-top: 2em;"/>

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
             @close="cancelDeleteWebhook"
             :actions="modalDeleteActions"><p style="line-break: normal">Vous êtes sur le point de supprimer le webhook suivant : <br/>-
                                                                         {{ modalDeleteText }} <br/>Cette action est irréversible.</p>
  </DsfrModal>

</template>

<style>
  table {
    display: inline-table !important;
  }
</style>

<script setup>
import {DsfrButton, DsfrInput} from "@gouvminint/vue-dsfr";
import fetchWithError from "@/scripts/fetchWithError.js";

const hookLabel = ref('Webhook infra');
const roomId = ref('!pKaqgPaNhBnAvPHjjr:agent.dev-durable.tchap.gouv.fr');
const webhookList = shallowRef([])
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


onMounted(() => {
  updateList()
})

function close () {
  alerteClosed.value = !alerteClosed.value
}

function closeCopyModal () {
  modalCopyOpened.value = !modalCopyOpened.value
}

function onClickGenerate () {

  fetchWithError(apiPath + '/api/create',
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
  fetchWithError(apiPath + '/api/getall',
    {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
    }
  )
    .then(stream => stream.json())
    .then(value => {
      if (value.map) webhookList.value = value.map(
        row => [
          row.webhook_label,
          {
            component: DsfrButton,
            label: "Copier le webhook",
            onClick: () => copyWebhook(row.webhook_id),
            icon: "ri-file-copy-line"
          },
          row.room_id,
          {
            component: DsfrButton,
            label: "Supprimer",
            iconOnly: true,
            onClick: () => confirmDeleteWebhook(row.webhook_id, row.webhook_label),
            icon: "fr-icon-delete-line"
          }]);
    })

  fetchWithError(apiPath + '/api/user',
    {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
    }
  )
}

function cancelDeleteWebhook () {
  modalDeleteOpened.value = false
  modalDeleteText.value = ''
  modalDeleteActions.value = []
}

function confirmDeleteWebhook (webhook_id, label) {
  modalDeleteText.value = label
  modalDeleteOpened.value = true
  modalDeleteActions.value = [
    {
      "label": "Confirmer",
      onClick: () => deleteWebhook(webhook_id)
    },
    {
      "label": "Annuler",
      onClick: () => cancelDeleteWebhook(),
      "secondary": true
    }
  ]
}

function deleteWebhook (webhook_id) {
  fetchWithError(apiPath + '/api/webhook/delete/',
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "webhook": webhook_id,
      })
    }
  ).then(stream => stream.json())
    .then(value => {
      console.log(value.message)

      if (value.message) {
        alerteClosed.value = false
        alerteType.value = value.message.type
        alerteTitle.value = value.message.title
        alerteDescription.value = value.message.description
      }

      cancelDeleteWebhook()
      updateList()
    })
}

function copyWebhook (webhookId) {

  console.log("toto")

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

</script>