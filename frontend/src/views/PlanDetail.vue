<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../api/client';

interface Plan {
  id: number;
  name: string;
  current_age: number;
  retirement_age: number;
  current_savings: number;
  monthly_contribution: number;
  annual_return: number;
  notes: string;
  projectedBalance: number;
}

const route = useRoute();
const plan = ref<Plan | null>(null);
const notesDraft = ref('');
const error = ref('');

async function loadPlan() {
  try {
    const res = await apiClient.get<Plan>(`/plans/${route.params.id}`);
    plan.value = res.data;
    notesDraft.value = res.data.notes ?? '';
  } catch (err: any) {
    error.value = err.response?.data?.error ?? 'Failed to load plan';
  }
}

async function saveNotes() {
  if (!plan.value) return;
  await apiClient.put(`/plans/${plan.value.id}`, {
    name: plan.value.name,
    currentAge: plan.value.current_age,
    retirementAge: plan.value.retirement_age,
    currentSavings: plan.value.current_savings,
    monthlyContribution: plan.value.monthly_contribution,
    annualReturn: plan.value.annual_return,
    notes: notesDraft.value,
  });
  await loadPlan();
}

onMounted(loadPlan);
</script>

<template>
  <div v-if="error" class="alert alert-danger">{{ error }}</div>

  <div v-if="plan">
    <h1 class="h3">{{ plan.name }}</h1>
    <p>Projected balance at retirement: <strong>${{ plan.projectedBalance.toLocaleString() }}</strong></p>

    <div class="card mb-4">
      <div class="card-body">
        <h2 class="h5">Notes</h2>
        <!--
          VULN: A05 Injection - CWE-79 Improper Neutralization of Input
          During Web Page Generation ("DOM-based / Stored Cross-Site
          Scripting"). The plan's free-text "notes" field is rendered with
          `v-html`, so any HTML/JavaScript a user saves in their notes
          (or another user's shared plan) executes in the viewer's browser
          instead of being displayed as plain text.
        -->
        <div class="border rounded p-2 mb-2" v-html="plan.notes"></div>
        <textarea v-model="notesDraft" class="form-control mb-2" rows="3"></textarea>
        <button class="btn btn-primary btn-sm" @click="saveNotes">Save notes</button>
      </div>
    </div>
  </div>
</template>
