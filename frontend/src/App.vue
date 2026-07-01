<script setup lang="ts">
import { useRouter } from 'vue-router';
import { clearToken, getToken } from './api/client';

const router = useRouter();

function logout() {
  clearToken();
  router.push({ name: 'login' });
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
      <router-link class="navbar-brand" to="/dashboard">Retirement Planner</router-link>
      <div class="navbar-nav">
        <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
        <router-link class="nav-link" to="/calculator">Calculator</router-link>
        <router-link class="nav-link" to="/settings">Settings</router-link>
      </div>
      <div class="ms-auto">
        <button v-if="getToken()" class="btn btn-outline-light btn-sm" @click="logout">Log out</button>
      </div>
    </div>
  </nav>
  <main class="container pb-5">
    <router-view />
  </main>
</template>
