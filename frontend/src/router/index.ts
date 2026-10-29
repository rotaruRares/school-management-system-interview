import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Role } from '../types';
import Login from '../views/Login.vue';

const HOME: Record<Role, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminDashboard.vue'),
      meta: { requiresAuth: true, role: 'ADMIN' },
    },
    {
      path: '/teacher',
      name: 'Teacher',
      component: () => import('../views/TeacherDashboard.vue'),
      meta: { requiresAuth: true, role: 'TEACHER' },
    },
    {
      path: '/student',
      name: 'Student',
      component: () => import('../views/StudentDashboard.vue'),
      meta: { requiresAuth: true, role: 'STUDENT' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.restore();

  if (to.meta.requiresAuth) {
    if (!auth.userRole) return '/login';
    if (to.meta.role !== auth.userRole) return HOME[auth.userRole];
  }
  if (to.path === '/login' && auth.userRole) {
    return HOME[auth.userRole];
  }
  return true;
});

export default router;
