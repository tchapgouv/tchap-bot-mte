<script setup
        lang="ts">

import useAuth from "./composable/useAuth";

useScheme()

const {user} = useAuth();

const serviceTitle = 'Webhooks Tchap'
const serviceDescription = 'Webhooks pour le bot Tchap GMCD'
const logoText = ['Ministère', 'de la Transition', 'écologique']

const login = {
  label: 'Se connecter',
  to: '/login',
  icon: 'ri-login-box-line',
  iconAttrs: {color: 'var(--success-425-625)'},
}
const logout = {
  label: 'Se déconnecter',
  to: '/logout',
  icon: 'ri-logout-box-line',
  iconAttrs: {color: 'var(--warning-425-625)'},
}

const quickLinks = ref([
  login
])

watch(user, async (newUser, _oldUser) => {
  if (newUser) {
    quickLinks.value = [
      logout,
      {
        label: 'Webhooks',
        to: '/webhooks',
        icon: 'fr-icon-anchor-fill',
        iconAttrs: {color: ''}
      },
      {
        label: 'Tester',
        to: '/postman',
        icon: 'ri-flask-line',
        iconAttrs: {color: 'var(--green-tilleul-verveine-sun-418-moon-817)'},
      }
    ]
  } else {
    quickLinks.value = [
      login
    ]
  }
})

const searchQuery = ref('')

</script>

<template>
  <DsfrHeader v-model="searchQuery"
              :service-title="serviceTitle"
              :service-description="serviceDescription"
              :logo-text="logoText"
              :quick-links="quickLinks"
              showBeta/>

  <div class="fr-container  fr-mt-3w  fr-mt-md-5w  fr-mb-5w">
    <router-view/>
  </div>
</template>