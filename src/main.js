import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { ensureLoggedIn } from './lib/api.js'

import DashboardView from './views/DashboardView.vue'
import NotFoundView from './views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard/0' },
    { path: '/dashboard/:token', component: DashboardView },
    { path: '/:pathMatch(.*)*', component: NotFoundView },
  ],
})

// Login before mounting so every subsequent call has a token ready
ensureLoggedIn()
  .then(() => createApp(App).use(router).mount('#app'))
  .catch(() => {
    // Fallback: mount anyway; api.js retry interceptor will handle per-request 401s
    createApp(App).use(router).mount('#app')
  })
