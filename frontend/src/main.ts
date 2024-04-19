import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons.min.css'

import '@gouvminint/vue-dsfr/styles'

import {createApp} from 'vue'

import App from './App.vue'
import router from './router/index'
import * as icons from './icons'
import {createPinia} from 'pinia'

import './main.css'

const app = createApp(App)

addIcons(...Object.values(icons)) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts
app.component('VIcon', OhVueIcon) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts

app.use(router)

const pinia = createPinia()
app.use(pinia)

app.mount('#app')
