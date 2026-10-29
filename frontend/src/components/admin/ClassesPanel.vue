<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Classes</h5>
      <button class="btn btn-sm btn-primary" @click="startCreate">
        <i class="bi bi-plus-lg"></i> Add class
      </button>
    </div>

    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

    <form v-if="showForm" class="card card-body mb-3" @submit.prevent="save">
      <h6 class="fw-bold">{{ editingId ? 'Edit class' : 'New class' }}</h6>
      <div class="row g-2">
        <div class="col-md-4"><input v-model="form.name" class="form-control" placeholder="Class name (e.g. 5A)" maxlength="50" required /></div>
        <div class="col-md-4">
          <select v-model="form.teacherId" class="form-select">
            <option :value="null">— no teacher —</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.firstName }} {{ t.lastName }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <button class="btn btn-primary btn-sm me-2" :disabled="saving">Save</button>
          <button type="button" class="btn btn-secondary btn-sm" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </form>

    <table class="table table-hover align-middle bg-white">
      <thead class="table-light">
        <tr><th>Name</th><th>Teacher</th><th>Students</th><th class="text-end">Actions</th></tr>
      </thead>
      <tbody>
        <template v-for="c in classes" :key="c.id">
          <tr>
            <td class="fw-semibold">{{ c.name }}</td>
            <td>
              <select class="form-select form-select-sm" :value="c.teacher?.id ?? ''" @change="changeTeacher(c, $event)">
                <option value="">— none —</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.firstName }} {{ t.lastName }}</option>
              </select>
            </td>
            <td>{{ c.studentCount }}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-secondary me-1" @click="toggle(c)">
                <i class="bi bi-people"></i> Students
              </button>
              <button class="btn btn-sm btn-outline-primary me-1" @click="startEdit(c)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" @click="remove(c)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
          <tr v-if="openId === c.id">
            <td colspan="4" class="bg-light">
              <div v-if="roster.length === 0" class="text-muted small mb-2">No students enrolled.</div>
              <ul class="list-group mb-2">
                <li v-for="s in roster" :key="s.id" class="list-group-item d-flex justify-content-between align-items-center py-1">
                  {{ s.firstName }} {{ s.lastName }} <span class="text-muted small">{{ s.email }}</span>
                  <button class="btn btn-sm btn-outline-danger" @click="removeStudent(c, s)"><i class="bi bi-x-lg"></i></button>
                </li>
              </ul>
              
              <div v-if="addable(c).length > 0" class="input-group input-group-sm">
                <select v-model="studentToAdd" class="form-select">
                  <option :value="null">Add a student…</option>
                  <!-- Nu mai afișăm paranteza cu clasa veche, pentru că acești elevi sigur nu au clasă -->
                  <option v-for="s in addable(c)" :key="s.id" :value="s.id">
                    {{ s.firstName }} {{ s.lastName }}
                  </option>
                </select>
                <button class="btn btn-primary" :disabled="studentToAdd === null" @click="addStudent(c)">Assign</button>
              </div>
              <div v-else class="alert alert-info py-2 mb-0 border-0">
                Toți elevii sunt deja într-o clasă.
              </div>
              
            </td>
          </tr>
        </template>
        <tr v-if="classes.length === 0"><td colspan="4" class="text-center text-muted py-3">No classes yet.</td></tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../../api';
import type { ClassStudent, SchoolClass, Student, Teacher } from '../../types';
import { errorMessage } from '../../utils/errors';

const classes = ref<SchoolClass[]>([]);
const teachers = ref<Teacher[]>([]);
const allStudents = ref<Student[]>([]);
const roster = ref<ClassStudent[]>([]);
const openId = ref<number | null>(null);
const studentToAdd = ref<number | null>(null);
const error = ref('');
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = ref({ name: '', teacherId: null as number | null });

async function load() {
  try {
    const [c, t, s] = await Promise.all([
      api.get<SchoolClass[]>('/classes'),
      api.get<Teacher[]>('/teachers'),
      api.get<Student[]>('/students'),
    ]);
    classes.value = c.data;
    teachers.value = t.data;
    allStudents.value = s.data;
    if (openId.value !== null) await loadRoster(openId.value);
  } catch (e) {
    error.value = errorMessage(e, 'Could not load classes.');
  }
}

async function loadRoster(id: number) {
  roster.value = (await api.get<ClassStudent[]>(`/classes/${id}/students`)).data;
}

function startCreate() {
  editingId.value = null;
  form.value = { name: '', teacherId: null };
  showForm.value = true;
}

function startEdit(c: SchoolClass) {
  editingId.value = c.id;
  form.value = { name: c.name, teacherId: c.teacher?.id ?? null };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    if (editingId.value) {
      await api.patch(`/classes/${editingId.value}`, { name: form.value.name, teacherId: form.value.teacherId });
    } else {
      const payload: Record<string, unknown> = { name: form.value.name };
      if (form.value.teacherId !== null) payload.teacherId = form.value.teacherId;
      await api.post('/classes', payload);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not save the class.');
  } finally {
    saving.value = false;
  }
}

async function changeTeacher(c: SchoolClass, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  error.value = '';
  try {
    await api.put(`/classes/${c.id}/teacher`, { teacherId: value === '' ? null : Number(value) });
  } catch (e) {
    error.value = errorMessage(e, 'Could not assign the teacher.');
  }
  await load();
}

async function toggle(c: SchoolClass) {
  if (openId.value === c.id) {
    openId.value = null;
    return;
  }
  openId.value = c.id;
  studentToAdd.value = null;
  try {
    await loadRoster(c.id);
  } catch (e) {
    error.value = errorMessage(e, 'Could not load the students.');
  }
}

function addable(c: SchoolClass) {
  return allStudents.value.filter((s) => !s.class);
}

async function addStudent(c: SchoolClass) {
  if (studentToAdd.value === null) return;
  try {
    await api.post(`/classes/${c.id}/students`, { studentIds: [studentToAdd.value] });
    studentToAdd.value = null;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not assign the student.');
  }
}

async function removeStudent(c: SchoolClass, s: ClassStudent) {
  try {
    await api.delete(`/classes/${c.id}/students/${s.id}`);
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not remove the student.');
  }
}

async function remove(c: SchoolClass) {
  if (!confirm(`Delete class ${c.name}? Its students will become unassigned.`)) return;
  try {
    await api.delete(`/classes/${c.id}`);
    if (openId.value === c.id) openId.value = null;
    await load();
  } catch (e) {
    error.value = errorMessage(e, 'Could not delete the class.');
  }
}

onMounted(load);
</script>