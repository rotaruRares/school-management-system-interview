<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Grades</h5>
      <button class="btn btn-sm btn-primary" @click="startCreate">
        <i class="bi bi-plus-lg"></i> Add grade
      </button>
    </div>

    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

    <form v-if="showForm" class="card card-body mb-3" @submit.prevent="save">
      <h6 class="fw-bold">{{ editingId ? 'Edit grade' : 'New grade' }}</h6>
      <div class="row g-2">
        <div class="col-md-3">
          <select v-model="form.studentId" class="form-select" :disabled="!!editingId" required>
            <option :value="null" disabled>Student…</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.firstName }} {{ s.lastName }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="form.subject" class="form-select" required>
            <option value="" disabled>Subject…</option>
            <option v-for="o in SUBJECT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="col-md-2"><input v-model.number="form.numericGrade" type="number" min="1" max="10" step="1" class="form-control" placeholder="1-10" required /></div>
        <div class="col-md-2"><input v-model="form.date" type="date" class="form-control" :max="today" /></div>
        <div class="col-md-2">
          <button class="btn btn-primary btn-sm me-2" :disabled="saving">Save</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </form>

    <div class="mb-2">
      <select v-model="filterStudentId" class="form-select form-select-sm w-auto" @change="load">
        <option :value="null">All students</option>
        <option v-for="s in students" :key="s.id" :value="s.id">{{ s.firstName }} {{ s.lastName }}</option>
      </select>
    </div>

    <table class="table table-hover align-middle bg-white">
      <thead class="table-light">
        <tr><th>Student</th><th>Subject</th><th>Grade</th><th>Date</th><th>Teacher</th><th class="text-end">Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="g in grades" :key="g.id">
          <td>{{ g.student.firstName }} {{ g.student.lastName }}</td>
          <td>{{ subjectLabel(g.subject) }}</td>
          <td><span class="badge bg-primary">{{ g.numericGrade }}</span></td>
          <td>{{ g.date }}</td>
          <td>{{ g.teacher ? `${g.teacher.firstName} ${g.teacher.lastName}` : '—' }}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(g)"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(g)"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
        <tr v-if="grades.length === 0"><td colspan="6" class="text-center text-muted py-3">No grades.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../../api';
import type { Grade, Student, Subject } from '../../types';
import { errorMessage } from '../../utils/errors';
import { SUBJECT_OPTIONS, subjectLabel } from '../../utils/subjects';

const grades = ref<Grade[]>([]);
const students = ref<Student[]>([]);
const filterStudentId = ref<number | null>(null);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const today = new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  studentId: null as number | null,
  subject: '' as Subject | '',
  numericGrade: 10,
  date: '',
});
const form = ref(emptyForm());

async function load() {
  try {
    const params = filterStudentId.value !== null ? { studentId: filterStudentId.value } : {};
    const [g, s] = await Promise.all([api.get<Grade[]>('/grades', { params }), api.get<Student[]>('/students')]);
    grades.value = g.data;
    students.value = s.data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load grades.');
  }
}

function startCreate() {
  editingId.value = null;
  form.value = emptyForm();
  showForm.value = true;
}

function startEdit(g: Grade) {
  editingId.value = g.id;
  form.value = { studentId: g.studentId, subject: g.subject, numericGrade: g.numericGrade, date: g.date };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const { studentId, subject, numericGrade, date } = form.value;
    if (editingId.value) {
      await api.patch(`/grades/${editingId.value}`, { subject, numericGrade, ...(date && { date }) });
    } else {
      await api.post('/grades', { studentId, subject, numericGrade, ...(date && { date }) });
    }
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not save the grade.');
  } finally {
    saving.value = false;
  }
}

async function remove(g: Grade) {
  if (!confirm('Delete this grade?')) return;
  try {
    await api.delete(`/grades/${g.id}`);
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not delete the grade.');
  }
}

onMounted(load);
</script>
