<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';

const username = ref('');
const password = ref('');
const email = ref('');
const error = ref('');
const success = ref(false);
const router = useRouter();

async function onSubmit() {
  error.value = '';
  try {
    await apiClient.post('/auth/register', {
      username: username.value,
      password: password.value,
      email: email.value,
    });
    success.value = true;
    setTimeout(() => router.push({ name: 'login' }), 1000);
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Registration failed';
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-md-5">
      <div class="card shadow-sm">
        <div class="card-body">
          <h1 class="h4 mb-3">Create an account</h1>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
          <div v-if="success" class="alert alert-success">Account created! Redirecting to login…</div>
          <form @submit.prevent="onSubmit">
            <div class="mb-3">
              <label class="form-label" for="username">Username</label>
              <input id="username" v-model="username" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="email">Email</label>
              <input id="email" v-model="email" type="email" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label" for="password">Password</label>
              <input id="password" v-model="password" type="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary w-100">Register</button>
          </form>
          <p class="mt-3 mb-0">
            Already have an account? <router-link to="/login">Log in</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
