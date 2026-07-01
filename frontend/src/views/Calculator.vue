<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '../api/client';

const formula = ref('balance * (1 + rate) + contribution');
const balance = ref(10000);
const rate = ref(0.06);
const contribution = ref(500);
const result = ref<number | null>(null);
const error = ref('');

async function calculate() {
  error.value = '';
  try {
    const res = await apiClient.post('/calculator/custom', {
      formula: formula.value,
      variables: { balance: balance.value, rate: rate.value, contribution: contribution.value },
    });
    result.value = res.data.result;
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Could not evaluate formula';
  }
}
</script>

<template>
  <h1 class="h3 mb-4">Advanced Projection Calculator</h1>
  <p class="text-muted">
    Power users can write their own projection formula using the variables
    <code>balance</code>, <code>rate</code> and <code>contribution</code>.
  </p>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>

  <div class="card">
    <div class="card-body">
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <label class="form-label">Balance</label>
          <input v-model.number="balance" type="number" class="form-control" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Annual rate (decimal)</label>
          <input v-model.number="rate" type="number" step="0.01" class="form-control" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Monthly contribution</label>
          <input v-model.number="contribution" type="number" class="form-control" />
        </div>
      </div>
      <label class="form-label">Formula</label>
      <input v-model="formula" class="form-control mb-3" />
      <button class="btn btn-primary" @click="calculate">Calculate</button>
      <p v-if="result !== null" class="mt-3 h5">Result: {{ result }}</p>
    </div>
  </div>
</template>
