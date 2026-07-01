<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { apiClient } from '../api/client';

const currency = ref('USD');
const theme = ref('light');
const emailNotifications = ref(true);
const smsNotifications = ref(false);
const saved = ref(false);

async function load() {
  const res = await apiClient.get('/settings');
  currency.value = res.data.currency ?? 'USD';
  theme.value = res.data.theme ?? 'light';
  emailNotifications.value = res.data.notifications?.email ?? true;
  smsNotifications.value = res.data.notifications?.sms ?? false;
}

async function save() {
  await apiClient.put('/settings', {
    currency: currency.value,
    theme: theme.value,
    notifications: { email: emailNotifications.value, sms: smsNotifications.value },
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

onMounted(load);
</script>

<template>
  <h1 class="h3 mb-4">Settings</h1>

  <div v-if="saved" class="alert alert-success">Settings saved.</div>

  <div class="card">
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label">Currency</label>
        <select v-model="currency" class="form-select">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Theme</label>
        <select v-model="theme" class="form-select">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="form-check mb-2">
        <input id="emailNotif" v-model="emailNotifications" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="emailNotif">Email notifications</label>
      </div>
      <div class="form-check mb-3">
        <input id="smsNotif" v-model="smsNotifications" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="smsNotif">SMS notifications</label>
      </div>
      <button class="btn btn-primary" @click="save">Save settings</button>
    </div>
  </div>
</template>
