<template>
  <div class="fr-container">
    <div class="fr-grid-row fr-mb-3w fr-grid-row--center">
      <DsfrAlert :title="alerteTitle"
                 :description="alerteDescription"
                 :type="alerteType"
                 :small="true"
                 :closeable="true"
                 :closed="alerteClosed"
                 @close="close"/>
    </div>
    <div class="fr-grid-row fr-mb-3w">
      <div class="fr-col-offset-3"/>
      <div class="fr-col-6">
        <DsfrInput v-model="username"
                   :label="'Identifiant :'"
                   :type="'text'"
                   :label-visible="true"></DsfrInput>
      </div>
    </div>
    <div class="fr-grid-row fr-mb-8w">
      <div class="fr-col-offset-3"/>
      <div class="fr-col-6">
        <DsfrInput v-model="password"
                   :label="'Mot de passe :'"
                   :type="'password'"
                   :label-visible="true"></DsfrInput>
      </div>
    </div>
    <div class="fr-grid-row fr-mb-3w fr-grid-row--center">
      <DsfrButton :label="'Se connecter'"
                  @click="login"></DsfrButton>
    </div>
  </div>
</template>

<style/>

<script setup
        lang="ts">

import fetchWithError from "../scripts/fetchWithError";
import useAuth from "../composable/useAuth";
import {useRouter} from 'vue-router'
import {DsfrInput} from "@gouvminint/vue-dsfr";

const username = ref('');
const password = ref('');
const apiPath = import.meta.env.VITE_API_ENDPOINT
const router = useRouter()
const {user} = useAuth();
const alerteType = ref('error')
const alerteDescription = ref('')
const alerteTitle = ref('')
const alerteClosed = ref(true)

if (user.value) router.push('/webhooks')

function close() {
  if (!alerteClosed.value) alerteClosed.value = true
}

function login() {

  fetchWithError(apiPath + '/api/auth',
    {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "username": username.value,
        "password": password.value,
      })
    }
  )
    .then(stream => stream.json())
    .then(value => {

      if (value.message) throw (value)

      alerteClosed.value = false
      alerteType.value = "success"
      alerteTitle.value = "Connecté"
      alerteDescription.value = value.user.cn + " connecté avec succès."
      user.value = value.user
      router.push('/webhooks')

    }).catch(e => {

    console.error(e)

    alerteClosed.value = false
    alerteType.value = "error"
    alerteTitle.value = "Erreur"
    alerteDescription.value = e.message

  })
}
</script>