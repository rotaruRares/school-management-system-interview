<template>
  <div>
    <AppNavbar title="School Management – Student" color="bg-info" />
    <div class="container my-4">
      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

      <div class="row mb-4">
        <div class="col-md-6 mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h5 class="fw-bold mb-3">My profile</h5>
              <template v-if="profile">
                <p class="mb-1"><strong>Name:</strong> {{ profile.firstName }} {{ profile.lastName }}</p>
                <p class="mb-1"><strong>Email:</strong> {{ profile.email }}</p>
                <p class="mb-1"><strong>Date of birth:</strong> {{ profile.dateOfBirth }}</p>
                <p class="mb-1"><strong>Class:</strong> {{ profile.class?.name ?? 'Not assigned yet' }}</p>
                <p class="mb-0" v-if="profile.class?.teacher">
                  <strong>Teacher:</strong> {{ profile.class.teacher.firstName }} {{ profile.class.teacher.lastName }}
                </p>
              </template>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center">
              <div class="bg-success text-white rounded-circle p-3 me-3"><i class="bi bi-graph-up-arrow fs-3"></i></div>
              <div>
                <h6 class="text-muted mb-0">Average grade</h6>
                <h2 class="fw-bold mb-0">{{ summary?.average ?? '—' }}</h2>
                <small class="text-muted">{{ summary?.count ?? 0 }} grade(s)</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-bold">My grades</div>
        <table class="table mb-0">
          <thead class="table-light"><tr><th>Subject</th><th>Grade</th><th>Date</th><th>Teacher</th></tr></thead>
          <tbody>
            <tr v-for="g in summary?.grades ?? []" :key="g.id">
              <td>{{ subjectLabel(g.subject) }}</td>
              <td><span class="badge bg-primary">{{ g.numericGrade }}</span></td>
              <td>{{ g.date }}</td>
              <td>{{ g.teacher ? `${g.teacher.firstName} ${g.teacher.lastName}` : '—' }}</td>
            </tr>
            <tr v-if="!summary || summary.grades.length === 0"><td colspan="4" class="text-center text-muted py-3">No grades yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api';
import AppNavbar from '../components/AppNavbar.vue';
import type { GradeSummary, StudentDetail } from '../types';
import { errorMessage } from '../utils/errors';
import { subjectLabel } from '../utils/subjects';

const profile = ref<StudentDetail | null>(null);
const summary = ref<GradeSummary | null>(null);
const error = ref('');

onMounted(async () => {
  try {
    const [p, g] = await Promise.all([api.get<StudentDetail>('/students/me'), api.get<GradeSummary>('/grades/me')]);
    profile.value = p.data;
    summary.value = g.data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load your data.');
  }
});
</script>
