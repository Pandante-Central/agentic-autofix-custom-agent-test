<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient, setToken } from '../api/client';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function onSubmit() {
  error.value = '';
  try {
    const res = await apiClient.post('/auth/login', {
      username: username.value,
      password: password.value,
    });
    setToken(res.data.token);
    router.push({ name: 'dashboard' });
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Login failed';
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-5">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="h4 mb-3">Log in</h1>
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
          <form @submit.prevent="onSubmit">
            <div class="mb-3">
              <label class="form-label" for="username">Username</label>
              <input id="username" v-model="username" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="password">Password</label>
              <input id="password" v-model="password" type="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Log in</button>
          </form>
          <p class="mt-3 mb-0">
            No account? <router-link to="/register">Register</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
