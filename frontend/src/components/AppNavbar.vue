<template>
  <nav class="navbar navbar-dark shadow-sm" :class="color">
    <div class="container">
      <span class="navbar-brand fw-bold">
        <i class="bi bi-mortarboard-fill me-2"></i>{{ title }}
      </span>
      <div class="d-flex align-items-center">
        <span class="text-white me-3 small d-none d-sm-inline">
          <i class="bi bi-person-circle me-1"></i>{{ auth.user?.email }}
        </span>
        <button class="btn btn-outline-light btn-sm" @click="logout">
          <i class="bi bi-box-arrow-right me-1"></i>Log out
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

defineProps<{ title: string; color: string }>();

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  await router.push('/login');
}
</script>
