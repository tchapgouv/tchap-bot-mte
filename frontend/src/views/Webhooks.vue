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

  <DsfrInput v-model="hookLabel"
             :label="'Webhook Label :'"
             :type="'text'"
             :label-visible="true">test
  </DsfrInput>

  <DsfrInput v-model="roomId"
             :label="'Room ID :'"
             :type="'text'"
             :label-visible="true">test
  </DsfrInput>
  <DsfrButton :label="'Générer'"
              @click="onClickGenerate"
              :style="'margin-bottom:25px; margin-top:25px; float: right;'"/>

  <!--  float clear hack  -->
  <div style="clear: both"/>

  <h4>Liste des Webhooks</h4>

  <div class="fr-grid-row fr-mb-3w">
    <div class="fr-col-10">
      <DsfrInput v-model="filter"
                 :label="'filtre :'"
                 :type="'text'"
                 :label-visible="true"
                 :style="'width : 33%;'"/>

    </div>
    <div class="fr-col-2 fr-grid-row--right">
      <DsfrSelect v-model="numberPerPages"
                  :label="'Par pages :'"
                  :options="[5, 10, 15, 25, 50, 100, 1000]"
                  :label-visible="true"/>
    </div>
  </div>

  <DsfrTable :headers="['Label', 
              'Webhook', 
              'Room Id', 
              'Bot Id', 
              'Action']"
             title=""
             :rows="filteredWebhooks"
             v-if="filteredWebhooks.length > 0"/>

  <div class="fr-grid-row fr-mb-3w fr-grid-row--center">
    <DsfrPagination v-model:current-page="currentPage"
                    :pages="pages"
                    v-if="filteredWebhooks.length > 0"/>
  </div>
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

import {type DsfrAlertType, DsfrButton, DsfrButtonGroup, DsfrInput} from "@gouvminint/vue-dsfr";
import fetchWithError from "@/scripts/fetchWithError";
import {useRouter} from "vue-router";
import WebhookTableLabel from "@/components/WebhookTableLabel.vue";
import {storeToRefs} from 'pinia';
import {useWebhookFilterStore} from '@/stores/webhooks'

const filterStore = useWebhookFilterStore()
const currentPage = ref(0)
const pages = ref<{
  href?: string,
  label: string,
  title: string
}[]>([])
const numberPerPages = ref(10)

const router = useRouter()

const hookLabel = ref('Webhook infra');
const roomId = ref('!pKaqgPaNhBnAvPHjjr:agent.dev-durable.tchap.gouv.fr');
const {filter} = storeToRefs(filterStore);
// const filter = ref("");
const webhookList = shallowRef([])
const apiPath = import.meta.env.VITE_API_ENDPOINT

const alerteType = ref<DsfrAlertType>('error')
const alerteDescription = ref('')
const alerteTitle = ref('')
const alerteClosed = ref(true)

const modalCopyTitle = ref('Webhook :')
const modalCopyText = ref('')
const modalCopyOpened = ref(false)

const modalDeleteText = ref('')
const modalDeleteOpened = ref(false)
const modalDeleteActions = ref([])

const EXPIRY_DATE = 1000 * 60 * 60 * 24 * 182 // 6 months

declare global {
  const navigator: any;
}

const filteredWebhooks = computed(() => {

  let webhooks: any[] = []
  for (const webhook of webhookList.value) {
    let push = false
    for (const index in webhook) {
      let tableCellData: any = webhook[index]
      let tableCellDataLabel, tableCellDataHiddenLabel
      if (tableCellData?.label) tableCellDataLabel = tableCellData.label
      if (typeof tableCellDataLabel === 'string') {
        if (tableCellDataLabel.toLowerCase().includes(filter.value.toLowerCase())) {
          push = true
        }
      }
      if (tableCellData?.hiddenLabel) tableCellDataHiddenLabel = tableCellData.hiddenLabel
      if (typeof tableCellDataHiddenLabel === 'string') {
        if (tableCellDataHiddenLabel.toLowerCase().includes(filter.value.toLowerCase())) {
          push = true
        }
      }
    }
    if (push) webhooks.push(webhook)
  }

  pages.value = []
  const maxPage = Math.round(webhooks.length / numberPerPages.value + 0.5)
  for (let i = 0; i < maxPage; i++) {
    pages.value.push({
      href: "#" + (i + 1),
      label: (i + 1) + '',
      title: (i + 1) + ''
    })
  }

  if (currentPage.value > maxPage) currentPage.value = maxPage

  return webhooks.slice(currentPage.value * numberPerPages.value, (currentPage.value + 1) * numberPerPages.value)
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
      router.push('/webhook/' + value.webhook_id)
    })
}

function hasScript(script: string) {
  if (script === '// Il est possible de manipuler la variable data (le message), qui sera récupérée et envoyée au bot à la fin du traitement.\ndata = data;') return false
  return script !== '';
}

function getAppendedLabel(row: WebhookRow) {

  const script: boolean = hasScript(row.script)
  const internet: boolean = row.internet
  let appended = ''

  if (script || internet) {
    appended += ' (W. '
    if (script) appended += "Script"
    if (script && internet) appended += ' & '
    if (internet) appended += 'Internet'
    appended += ')'
  }

  return appended;
}

function updateList() {
  fetchWithError(apiPath + '/api/webhook/list',
    {
      method: "GET",
    }
  )
    .then(stream => stream.json())
    .then(value => {
      let mappedList = []
      if (value.map) mappedList = value.map(
        (row: WebhookRow) => [
          {
            component: WebhookTableLabel,
            label: row.webhook_label.replace(/:.*?($| )/g, "$1") + getAppendedLabel(row),
            hiddenLabel: (hasScript(row.script) ? "script " : " ") + (row.internet ? "internet " : " ") + (Date.now() - row.lastUseEpoch > EXPIRY_DATE ? "inutilisé expiré vieux old " : " "),
            hasScript: hasScript(row.script),
            expired: Date.now() - row.lastUseEpoch > EXPIRY_DATE,
            isInternet: row.internet,
            lastUseEpoch: row.lastUseEpoch,
            webhook_id: row.webhook_id,
            loading: true,
            error: false,
            errorReason: ""
          },
          {
            component: DsfrButton,
            label: "Copier le webhook",
            onClick: () => copyWebhook("https://tchap-bot.mel.e2.rie.gouv.fr/api/webhook/post/" + row.webhook_id),
            icon: "ri-file-copy-line"
          },
          row.room_id.replace(/:.*?($| )/g, "$1"),
          row.bot_id.replace(/:.*?($| )/g, "$1"),
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
                  tertiary: true,
                  icon: {name: 'ri-flask-line', fill: 'var(--yellow-moutarde-sun-348-moon-860)'}
                }
              ]
          }
        ]);

      for (const mappedListElement of mappedList) {
        fetchWithError(apiPath + '/api/webhook/check',
          {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              "webhook_id": mappedListElement[0].webhook_id,
            })
          }
        )
          .then(stream => stream.json())
          .then(value => {
            mappedListElement[0].loading = false
            mappedListElement[0].error = value.hasError
            mappedListElement[0].errorReason = value.reason
            if (value.hasError)mappedListElement[0].hiddenLabel += "erreur error KO " + value.reason
            triggerRef(webhookList)
          })

      }

      webhookList.value = mappedList
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
  internet: boolean
  lastUseEpoch: number
}

</script>