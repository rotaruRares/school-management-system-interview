<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow-lg p-4 style-card" style="width: 100%; max-width: 420px;">
      <div class="card-body text-center">
        <div class="mb-3">
          <i class="bi bi-mortarboard-fill text-primary display-4"></i>
        </div>
        <h3 class="card-title fw-bold mb-1">School Management</h3>
        <p class="text-muted small mb-4">Sign in to continue</p>

        <form @submit.prevent="handleLogin">
          <div class="mb-3 text-start">
            <label class="form-label fw-semibold">Email</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-envelope"></i></span>
              <input
                type="email"
                v-model="email"
                class="form-control"
                placeholder="name@school.com"
                required
              />
            </div>
          </div>

          <div class="mb-4 text-start">
            <label class="form-label fw-semibold">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock"></i></span>
              <input
                type="password"
                v-model="password"
                class="form-control"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-box-arrow-in-right me-2"></i>
            Sign in
          </button>

          <div v-if="errorText" class="alert alert-danger mt-3 py-2 small" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ errorText }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { errorMessage } from '../utils/errors';

const email = ref('');
const password = ref('');
const errorText = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  try {
    loading.value = true;
    errorText.value = '';
    const role = await authStore.login(email.value, password.value);

    if (role === 'ADMIN') router.push('/admin');
    else if (role === 'TEACHER') router.push('/teacher');
    else if (role === 'STUDENT') router.push('/student');
  } catch (error) {
    errorText.value = errorMessage(error, 'Could not sign in.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.style-card {
  border-radius: 12px;
  border: none;
}
</style>
