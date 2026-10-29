<template>
  <div>
    <AppNavbar title="School Management – Admin" color="bg-primary" />
    <div class="container my-4">
      <ul class="nav nav-tabs mb-4">
        <li v-for="t in tabs" :key="t.key" class="nav-item">
          <button class="nav-link" :class="{ active: tab === t.key }" @click="tab = t.key">
            <i :class="['bi', t.icon, 'me-1']"></i>{{ t.label }}
          </button>
        </li>
      </ul>
      <StudentsPanel v-if="tab === 'students'" />
      <TeachersPanel v-else-if="tab === 'teachers'" />
      <ClassesPanel v-else-if="tab === 'classes'" />
      <GradesPanel v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';
import ClassesPanel from '../components/admin/ClassesPanel.vue';
import GradesPanel from '../components/admin/GradesPanel.vue';
import StudentsPanel from '../components/admin/StudentsPanel.vue';
import TeachersPanel from '../components/admin/TeachersPanel.vue';

const tabs = [
  { key: 'students', label: 'Students', icon: 'bi-backpack4' },
  { key: 'teachers', label: 'Teachers', icon: 'bi-person-workspace' },
  { key: 'classes', label: 'Classes', icon: 'bi-easel' },
  { key: 'grades', label: 'Grades', icon: 'bi-card-checklist' },
];
const tab = ref('students');
</script>
