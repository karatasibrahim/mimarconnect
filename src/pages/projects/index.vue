<script setup>
import ProjectsListTable from '@/views/projects/ProjectsListTable.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Project',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Projeler
    </h4>
    <ProjectsListTable />
  </div>
</template>
