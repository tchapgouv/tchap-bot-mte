<template>
  <div>
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

if (user.value) router.push('/webhooks')

function login () {

  fetchWithError(apiPath + '/auth',
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
      console.log(value)
      user.value = value.user
      router.push('/webhooks')
    }).catch(e => console.error(e))
}
</script>