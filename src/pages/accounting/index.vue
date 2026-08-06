<script setup>
import TransactionsListTable from '@/views/accounting/TransactionsListTable.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Transaction',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Muhasebe
    </h4>
    <TransactionsListTable />
  </div>
</template>
