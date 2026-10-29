<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Teachers</h5>
      <button class="btn btn-sm btn-primary" @click="startCreate">
        <i class="bi bi-plus-lg"></i> Add teacher
      </button>
    </div>

    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

    <form v-if="showForm" class="card card-body mb-3" @submit.prevent="save">
      <h6 class="fw-bold">{{ editingId ? 'Edit teacher' : 'New teacher' }}</h6>
      <div class="row g-2">
        <div class="col-md-3"><input v-model="form.firstName" class="form-control" placeholder="First name" maxlength="50" required /></div>
        <div class="col-md-3"><input v-model="form.lastName" class="form-control" placeholder="Last name" maxlength="50" required /></div>
        <div class="col-md-3"><input v-model="form.email" type="email" class="form-control" placeholder="Email" maxlength="254" required /></div>
        <div class="col-md-3">
          <input v-model="form.password" type="password" class="form-control" minlength="8" maxlength="72"
                 :placeholder="editingId ? 'New password (optional)' : 'Password (min 8, letter + digit)'" :required="!editingId" />
        </div>
      </div>
      <div class="mt-3">
        <button class="btn btn-primary btn-sm me-2" :disabled="saving">Save</button>
        <button type="button" class="btn btn-secondary btn-sm" @click="showForm = false">Cancel</button>
      </div>
    </form>

    <table class="table table-hover align-middle bg-white">
      <thead class="table-light">
        <tr><th>Name</th><th>Email</th><th>Classes</th><th class="text-end">Actions</th></tr>
      </thead>
      <tbody>
        <tr v-for="t in teachers" :key="t.id">
          <td>{{ t.firstName }} {{ t.lastName }}</td>
          <td>{{ t.email }}</td>
          <td>{{ t.classes.map((c) => c.name).join(', ') || '—' }}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(t)"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(t)"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
        <tr v-if="teachers.length === 0"><td colspan="4" class="text-center text-muted py-3">No teachers yet.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../../api';
import type { Teacher } from '../../types';
import { errorMessage } from '../../utils/errors';

const teachers = ref<Teacher[]>([]);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const emptyForm = () => ({ firstName: '', lastName: '', email: '', password: '' });
const form = ref(emptyForm());

async function load() {
  try {
    teachers.value = (await api.get<Teacher[]>('/teachers')).data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load teachers.');
  }
}

function startCreate() {
  editingId.value = null;
  form.value = emptyForm();
  showForm.value = true;
}

function startEdit(t: Teacher) {
  editingId.value = t.id;
  form.value = { firstName: t.firstName, lastName: t.lastName, email: t.email, password: '' };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const payload: Record<string, unknown> = { ...form.value };
    if (!payload.password) delete payload.password;
    if (editingId.value) {
      await api.patch(`/teachers/${editingId.value}`, payload);
    } else {
      await api.post('/teachers', payload);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not save the teacher.');
  } finally {
    saving.value = false;
  }
}

async function remove(t: Teacher) {
  if (!confirm(`Delete ${t.firstName} ${t.lastName}? Their classes become unassigned; the grades they gave are kept.`)) return;
  try {
    await api.delete(`/teachers/${t.id}`);
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not delete the teacher.');
  }
}

onMounted(load);
</script>
