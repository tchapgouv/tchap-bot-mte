import {createRouter, createWebHistory} from 'vue-router'
import Logout from "@/views/Logout.vue";
import Login from "@/views/Login.vue";
import useAuth from "@/composable/useAuth";
import Webhooks from "@/views/Webhooks.vue";
import Postman from "@/views/Postman.vue";

const {useCheckAuth} = useAuth()

const MAIN_TITLE = 'Bot GMCD'

const routes = [
  {
    path: '/webhooks',
    name: 'Webhooks',
    component: Webhooks,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/postman',
    name: 'Postman',
    component: Postman,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    alias: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env?.BASE_URL || ''),
  routes,
})

router.beforeEach(async (to, from, next) => {

  if (to.meta.requiresAuth) {
    if (!(await useCheckAuth())) {
      if (to.path !== '/login') {
        return next({name: 'Login'})
      }
    }
  }
  next()
})

router.beforeEach((to) => { // Cf. https://github.com/vueuse/head pour des transformations avancées de Head

  const specificTitle = to.meta.title ? `${to.meta.title} - ` : ''
  document.title = `${specificTitle}${MAIN_TITLE}`
})

export default router
