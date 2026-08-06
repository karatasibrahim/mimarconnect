<script setup>
import TenantsAdminTable from '@/views/admin/TenantsAdminTable.vue'

definePage({
  meta: {
    action: 'manage',
    subject: 'PlatformAdmin',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Platform Yönetimi — Ofisler
    </h4>
    <TenantsAdminTable />
  </div>
</template>
