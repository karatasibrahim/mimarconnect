<script setup>
import QuotesListTable from '@/views/quotes/QuotesListTable.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Quote',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Teklifler
    </h4>
    <QuotesListTable />
  </div>
</template>
