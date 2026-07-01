<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';

interface Plan {
  id: number;
  name: string;
  current_age: number;
  retirement_age: number;
  current_savings: number;
  monthly_contribution: number;
  annual_return: number;
  projectedBalance: number;
}

const plans = ref<Plan[]>([]);
const loading = ref(true);
const error = ref('');
const router = useRouter();

const form = ref({
  name: '',
  currentAge: 30,
  retirementAge: 65,
  currentSavings: 10000,
  monthlyContribution: 500,
  annualReturn: 6,
});

async function loadPlans() {
  loading.value = true;
  try {
    const res = await apiClient.get<Plan[]>('/plans');
    plans.value = res.data;
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Failed to load plans';
  } finally {
    loading.value = false;
  }
}

async function createPlan() {
  error.value = '';
  try {
    await apiClient.post('/plans', form.value);
    form.value.name = '';
    await loadPlans();
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Failed to create plan';
  }
}

function openPlan(id: number) {
  router.push({ name: 'plan-detail', params: { id } });
}

onMounted(loadPlans);
</script>

<template>
  <h1 class="h3 mb-4">Your Retirement Plans</h1>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>

  <div class="card mb-4">
    <div class="card-body">
      <h2 class="h5">New plan</h2>
      <form class="row g-2" @submit.prevent="createPlan">
        <div class="col-md-4">
          <input v-model="form.name" class="form-control" placeholder="Plan name" required />
        </div>
        <div class="col-md-2">
          <input v-model.number="form.currentAge" type="number" class="form-control" placeholder="Current age" />
        </div>
        <div class="col-md-2">
          <input v-model.number="form.retirementAge" type="number" class="form-control" placeholder="Retirement age" />
        </div>
        <div class="col-md-2">
          <input v-model.number="form.currentSavings" type="number" class="form-control" placeholder="Savings" />
        </div>
        <div class="col-md-2">
          <input v-model.number="form.monthlyContribution" type="number" class="form-control" placeholder="Monthly $" />
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary">Create plan</button>
        </div>
      </form>
    </div>
  </div>

  <div v-if="loading">Loading…</div>
  <div v-else class="row g-3">
    <div v-for="plan in plans" :key="plan.id" class="col-md-4">
      <div class="card h-100 shadow-sm" role="button" @click="openPlan(plan.id)">
        <div class="card-body">
          <h3 class="h5">{{ plan.name }}</h3>
          <p class="mb-1">Retire at {{ plan.retirement_age }}</p>
          <p class="fw-bold text-success mb-0">
            Projected: ${{ plan.projectedBalance.toLocaleString() }}
          </p>
        </div>
      </div>
    </div>
    <div v-if="plans.length === 0" class="text-muted">No plans yet — create your first one above.</div>
  </div>
</template>
