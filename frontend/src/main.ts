import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons.min.css'

import '@gouvminint/vue-dsfr/styles'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router/index'
import * as icons from './icons'

import './main.css'

addIcons(...Object.values(icons)) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts

createApp(App)
  .component('VIcon', OhVueIcon) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts
  .use(router)
  .mount('#app')
