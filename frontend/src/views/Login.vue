<template>
  <div>
    <DsfrAlert :title="alerteTitle"
               :description="alerteDescription"
               :type="alerteType"
               :small="true"
               :closeable="true"
               :closed="alerteClosed"
               @close="close"/>
    <br/>
      <dsfr-input v-model="username"
                  :label="'Identifiant :'"
                  :type="'text'"
                  :label-visible="true"></dsfr-input>
      <br/>
      <dsfr-input v-model="password"
                  :label="'Mot de passe :'"
                  :type="'password'"
                  :label-visible="true"></dsfr-input>
      <br/>
      <dsfr-button :label="'Se connecter'"
                   @click="login"></dsfr-button>
  </div>
</template>

<script setup>

import fetchWithError from "@/scripts/fetchWithError.js";
import useAuth from "@/composable/useAuth.js";
import {useRouter} from 'vue-router'

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

function close () {
  if (!alerteClosed.value) alerteClosed.value = true
}

function login () {

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