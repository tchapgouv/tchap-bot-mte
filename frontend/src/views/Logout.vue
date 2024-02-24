<template/>

<style/>

<script setup
        lang="ts">

import {useRouter} from 'vue-router'
import useAuth from "../composable/useAuth";

const apiPath = import.meta.env.VITE_API_ENDPOINT
const router = useRouter()
const {user} = useAuth()

fetch(apiPath + '/api/logout', {
  method: 'POST',
  credentials: 'include'
}).then(res => res.json())
  .then((data:any) => {

    if (data.success) {
      user.value = null
      router.push('/login')
    }

  })
  .catch(err => console.error(err))

</script>