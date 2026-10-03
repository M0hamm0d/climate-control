import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

// Hash history: the ESP8266 serves static files with no SPA fallback, so
// /dashboard-style paths would 404 on refresh. Hash URLs work everywhere.
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    {
      path: '/controls',
      name: 'controls',
      component: () => import('../views/ControlsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/exhibition',
      name: 'exhibition',
      component: () => import('../views/ExhibitionView.vue'),
    },
  ],
})

export default router
