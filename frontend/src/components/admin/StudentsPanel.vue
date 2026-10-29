<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Students</h5>
      <button class="btn btn-sm btn-primary" @click="startCreate">
        <i class="bi bi-plus-lg"></i> Add student
      </button>
    </div>

    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

    <form v-if="showForm" class="card card-body mb-3" @submit.prevent="save">
      <h6 class="fw-bold">{{ editingId ? 'Edit student' : 'New student' }}</h6>
      <div class="row g-2">
        <div class="col-md-3"><input v-model="form.firstName" class="form-control" placeholder="First name" maxlength="50" required /></div>
        <div class="col-md-3"><input v-model="form.lastName" class="form-control" placeholder="Last name" maxlength="50" required /></div>
        <div class="col-md-3"><input v-model="form.email" type="email" class="form-control" placeholder="Email" maxlength="254" required /></div>
        <div class="col-md-3">
          <input v-model="form.password" type="password" class="form-control" minlength="8" maxlength="72"
                 :placeholder="editingId ? 'New password (optional)' : 'Password (min 8, letter + digit)'" :required="!editingId" />
        </div>
        <div class="col-md-3">
          <label class="form-label small mb-0">Date of birth</label>
          <input v-model="form.dateOfBirth" type="date" class="form-control" :max="today" required />
        </div>
        <div class="col-md-3">
          <label class="form-label small mb-0">Class</label>
          <select v-model="form.classId" class="form-select">
            <option :value="null">— none —</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <div class="mt-3">
        <button class="btn btn-primary btn-sm me-2" :disabled="saving">Save</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="showForm = false">Cancel</button>
      </div>
    </form>

    <table class="table table-hover align-middle bg-white">
      <thead class="table-light">
        <tr><th>Name</th><th>Email</th><th>Date of birth</th><th>Class</th><th class="text-end">Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in students" :key="s.id">
          <td>{{ s.firstName }} {{ s.lastName }}</td>
          <td>{{ s.email }}</td>
          <td>{{ s.dateOfBirth }}</td>
          <td>{{ s.class?.name ?? '—' }}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(s)"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(s)"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
        <tr v-if="students.length === 0"><td colspan="5" class="text-center text-muted py-3">No students yet.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../../api';
import type { SchoolClass, Student } from '../../types';
import { errorMessage } from '../../utils/errors';

const students = ref<Student[]>([]);
const classes = ref<SchoolClass[]>([]);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const today = new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  classId: null as number | null,
});
const form = ref(emptyForm());

async function load() {
  try {
    const [s, c] = await Promise.all([api.get<Student[]>('/students'), api.get<SchoolClass[]>('/classes')]);
    students.value = s.data;
    classes.value = c.data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load students.');
  }
}

function startCreate() {
  editingId.value = null;
  form.value = emptyForm();
  showForm.value = true;
}

function startEdit(s: Student) {
  editingId.value = s.id;
  form.value = {
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    password: '',
    dateOfBirth: s.dateOfBirth,
    classId: s.class?.id ?? null,
  };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const payload: Record<string, unknown> = { ...form.value };
    if (!payload.password) delete payload.password;
    if (editingId.value) {
      await api.patch(`/students/${editingId.value}`, payload);
    } else {
      if (payload.classId === null) delete payload.classId;
      await api.post('/students', payload);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not save the student.');
  } finally {
    saving.value = false;
  }
}

async function remove(s: Student) {
  if (!confirm(`Delete ${s.firstName} ${s.lastName} and all their grades?`)) return;
  try {
    await api.delete(`/students/${s.id}`);
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not delete the student.');
  }
}

onMounted(load);
</script>
