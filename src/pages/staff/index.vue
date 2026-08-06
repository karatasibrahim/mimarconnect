<script setup>
import StaffListTable from '@/views/staff/StaffListTable.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Staff',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Personel
    </h4>
    <StaffListTable />
  </div>
</template>
