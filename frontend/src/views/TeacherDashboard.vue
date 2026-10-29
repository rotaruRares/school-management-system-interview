<template>
  <div>
    <AppNavbar title="School Management – Teacher" color="bg-success" />
    <div class="container my-4">
      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

      <div class="row">
        <div class="col-md-4 mb-3">
          <h5 class="fw-bold">My classes</h5>
          <div class="list-group">
            <button v-for="c in classes" :key="c.id" class="list-group-item list-group-item-action d-flex justify-content-between"
                    :class="{ active: selected?.id === c.id }" @click="select(c.id)">
              {{ c.name }} <span class="badge bg-secondary">{{ c.studentCount }}</span>
            </button>
            <div v-if="classes.length === 0" class="list-group-item text-muted">No classes assigned to you.</div>
          </div>
        </div>

        <div v-if="selected" class="col-md-8">
          <h5 class="fw-bold">Class {{ selected.name }} – students</h5>
          <table class="table table-hover align-middle bg-white">
            <thead class="table-light"><tr><th>Name</th><th>Email</th><th class="text-end">Grades</th></tr></thead>
            <tbody>
              <tr v-for="s in selected.students" :key="s.id">
                <td>{{ s.firstName }} {{ s.lastName }}</td>
                <td>{{ s.email }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-success me-1" @click="openStudent(s)">View</button>
                  <button class="btn btn-sm btn-success" @click="startAdd(s)"><i class="bi bi-plus-lg"></i> Add grade</button>
                </td>
              </tr>
              <tr v-if="selected.students.length === 0"><td colspan="3" class="text-center text-muted py-3">No students in this class.</td></tr>
            </tbody>
          </table>

          <form v-if="gradeForm" class="card card-body mb-3" @submit.prevent="saveGrade">
            <h6 class="fw-bold">{{ gradeForm.id ? 'Edit grade' : 'New grade' }} – {{ gradeForm.studentName }}</h6>
            <div class="row g-2">
              <div class="col-md-4">
                <select v-model="gradeForm.subject" class="form-select" required>
                  <option value="" disabled>Subject…</option>
                  <option v-for="o in SUBJECT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
              <div class="col-md-3"><input v-model.number="gradeForm.numericGrade" type="number" min="1" max="10" step="1" class="form-control" required /></div>
              <div class="col-md-3"><input v-model="gradeForm.date" type="date" class="form-control" :max="today" /></div>
              <div class="col-md-2">
                <button class="btn btn-success btn-sm me-1" :disabled="saving">Save</button>
                <button type="button" class="btn btn-secondary btn-sm" @click="gradeForm = null">Cancel</button>
              </div>
            </div>
          </form>

          <div v-if="viewed">
            <h6 class="fw-bold">
              Grades – {{ viewed.name }}
              <span class="badge bg-primary ms-2">Average: {{ viewed.summary.average ?? '—' }}</span>
            </h6>
            <table class="table table-sm bg-white">
              <thead class="table-light"><tr><th>Subject</th><th>Grade</th><th>Date</th><th>Given by</th><th></th></tr></thead>
              <tbody>
                <tr v-for="g in viewed.summary.grades" :key="g.id">
                  <td>{{ subjectLabel(g.subject) }}</td>
                  <td><span class="badge bg-primary">{{ g.numericGrade }}</span></td>
                  <td>{{ g.date }}</td>
                  <td>{{ g.teacher ? `${g.teacher.firstName} ${g.teacher.lastName}` : '—' }}</td>
                  <td class="text-end">
                    <button v-if="g.teacher && g.teacher.id === myTeacherId" class="btn btn-sm btn-outline-primary" @click="startEdit(g)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="viewed.summary.grades.length === 0"><td colspan="5" class="text-muted text-center">No grades yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import AppNavbar from '../components/AppNavbar.vue';
import { useAuthStore } from '../stores/auth';
import type { ClassDetail, ClassStudent, Grade, GradeSummary, SchoolClass, Subject } from '../types';
import { errorMessage } from '../utils/errors';
import { SUBJECT_OPTIONS, subjectLabel } from '../utils/subjects';

interface GradeForm {
  id?: number;
  studentId: number;
  studentName: string;
  subject: Subject | '';
  numericGrade: number;
  date: string;
}

const auth = useAuthStore();
const myTeacherId = computed(() => auth.user?.teacherId ?? null);
const today = new Date().toISOString().slice(0, 10);

const classes = ref<SchoolClass[]>([]);
const selected = ref<ClassDetail | null>(null);
const viewed = ref<{ studentId: number; name: string; summary: GradeSummary } | null>(null);
const gradeForm = ref<GradeForm | null>(null);
const saving = ref(false);
const error = ref('');

async function loadClasses() {
  try {
    classes.value = (await api.get<SchoolClass[]>('/classes')).data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load classes.');
  }
}

async function select(id: number) {
  viewed.value = null;
  gradeForm.value = null;
  try {
    selected.value = (await api.get<ClassDetail>(`/classes/${id}`)).data;
  } catch (e) {
    error.value = errorMessage(e, 'Could not load the class.');
  }
}

async function openStudent(s: ClassStudent) {
  try {
    const summary = (await api.get<GradeSummary>(`/grades/student/${s.id}`)).data;
    viewed.value = { studentId: s.id, name: `${s.firstName} ${s.lastName}`, summary };
  } catch (e) {
    error.value = errorMessage(e, 'Could not load the grades.');
  }
}

function startAdd(s: ClassStudent) {
  gradeForm.value = { studentId: s.id, studentName: `${s.firstName} ${s.lastName}`, subject: '', numericGrade: 10, date: '' };
}

function startEdit(g: Grade) {
  if (!viewed.value) return;
  gradeForm.value = {
    id: g.id,
    studentId: g.studentId,
    studentName: viewed.value.name,
    subject: g.subject,
    numericGrade: g.numericGrade,
    date: g.date,
  };
}

async function saveGrade() {
  if (!gradeForm.value) return;
  const { id, studentId, subject, numericGrade, date } = gradeForm.value;
  saving.value = true;
  error.value = '';
  try {
    if (id) {
      await api.patch(`/grades/${id}`, { subject, numericGrade, ...(date && { date }) });
    } else {
      await api.post('/grades', { studentId, subject, numericGrade, ...(date && { date }) });
    }
    gradeForm.value = null;
    const student = selected.value?.students.find((s) => s.id === studentId);
    if (student) await openStudent(student);
  } catch (e) {
    error.value = errorMessage(e, 'Could not save the grade.');
  } finally {
    saving.value = false;
  }
}

onMounted(loadClasses);
</script>
