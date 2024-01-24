import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons.min.css'

import '@gouvminint/vue-dsfr/styles'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router/index'
import * as icons from './icons'

import './main.css'
// import useAuth from "@/composable/useAuth";

// const { useCheckAuth } = useAuth()

// router.beforeEach(async (to, from, next) => {
//   if(to.meta.requiresAuth){
//     if(!(await useCheckAuth())){
//       return next({name: 'login'})
//     }
//   }
//   else if(to.meta.guest){
//     if(await useCheckAuth()){
//       return next({name: '/'})
//     }
//   }
//   next()
// })

addIcons(...Object.values(icons)) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts

createApp(App)
  .component('VIcon', OhVueIcon) // Autoimporté grâce à ohVueIconAutoimportPreset dans vite.config.ts
  .use(router)
  .mount('#app')
