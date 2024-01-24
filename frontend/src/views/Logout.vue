<template/>
<script setup>
import {useRouter} from 'vue-router'
import useAuth from "@/composable/useAuth.js";

const apiPath = import.meta.env.VITE_API_ENDPOINT
const router = useRouter()
const {user} = useAuth()

fetch(apiPath + '/logout', {
  method: 'POST',
  credentials: 'include'
}).then(res => res.json())
  .then(data => {

    if (data.success) {
      user.value = null
      router.push('/login')
    }

  })
  .catch(err => console.error(err))

</script>