<script setup>
import ClientsListTable from '@/views/clients/ClientsListTable.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Client',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Müşteriler
    </h4>
    <ClientsListTable />
  </div>
</template>
