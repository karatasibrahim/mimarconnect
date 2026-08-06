<script setup>
import TransactionDrawer from '@/views/accounting/TransactionDrawer.vue'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const { items: transactions, isLoading, add, update, remove } = useFirestoreCrud('transactions')
const { items: projects } = useFirestoreCrud('projects')

const projectTitle = id => projects.value.find(p => p.id === id)?.title ?? '—'

const typeFilter = ref('all')

const filteredTransactions = computed(() => {
  if (typeFilter.value === 'all')
    return transactions.value

  return transactions.value.filter(t => t.type === typeFilter.value)
})

const totalIncome = computed(() => transactions.value
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + (t.amount || 0), 0))

const totalExpense = computed(() => transactions.value
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + (t.amount || 0), 0))

const net = computed(() => totalIncome.value - totalExpense.value)

const formatCurrency = amount => `${(amount || 0).toLocaleString('tr-TR')} ₺`

const isDrawerOpen = ref(false)
const editingTransaction = ref(null)

const openAddDrawer = () => {
  editingTransaction.value = null
  isDrawerOpen.value = true
}

const openEditDrawer = transaction => {
  editingTransaction.value = transaction
  isDrawerOpen.value = true
}

const onSubmit = async payload => {
  if (editingTransaction.value)
    await update(editingTransaction.value.id, payload)
  else
    await add(payload)
}

const deleteDialog = ref(false)
const transactionToDelete = ref(null)

const confirmDelete = transaction => {
  transactionToDelete.value = transaction
  deleteDialog.value = true
}

const doDelete = async () => {
  if (transactionToDelete.value)
    await remove(transactionToDelete.value.id)
  deleteDialog.value = false
  transactionToDelete.value = null
}

const headers = [
  { title: 'TARİH', key: 'date' },
  { title: 'KATEGORİ', key: 'category' },
  { title: 'PROJE', key: 'projectId' },
  { title: 'TUTAR', key: 'amount' },
  { title: 'AKSİYONLAR', key: 'actions', sortable: false, align: 'end' },
]
</script>

<template>
  <div>
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText>
            <span class="text-body-2">Toplam Gelir</span>
            <h5 class="text-h5 text-success">
              {{ formatCurrency(totalIncome) }}
            </h5>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText>
            <span class="text-body-2">Toplam Gider</span>
            <h5 class="text-h5 text-error">
              {{ formatCurrency(totalExpense) }}
            </h5>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <VCard>
          <VCardText>
            <span class="text-body-2">Net</span>
            <h5
              class="text-h5"
              :class="net >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(net) }}
            </h5>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 align-center justify-space-between">
        <VBtnToggle
          v-model="typeFilter"
          density="compact"
          mandatory
          color="primary"
        >
          <VBtn value="all">
            Tümü
          </VBtn>
          <VBtn value="income">
            Gelir
          </VBtn>
          <VBtn value="expense">
            Gider
          </VBtn>
        </VBtnToggle>

        <VBtn
          v-if="$can('create', 'Transaction')"
          prepend-icon="tabler-plus"
          @click="openAddDrawer"
        >
          Yeni Kayıt
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filteredTransactions"
        :loading="isLoading"
        no-data-text="Kayıtlı gelir/gider bulunamadı."
        loading-text="Yükleniyor..."
      >
        <template #item.projectId="{ item }">
          {{ item.projectId ? projectTitle(item.projectId) : '—' }}
        </template>

        <template #item.amount="{ item }">
          <span :class="item.type === 'income' ? 'text-success' : 'text-error'">
            {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <IconBtn
            v-if="$can('update', 'Transaction')"
            @click="openEditDrawer(item)"
          >
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn
            v-if="$can('delete', 'Transaction')"
            @click="confirmDelete(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <TransactionDrawer
      v-model:is-drawer-open="isDrawerOpen"
      :transaction-data="editingTransaction"
      @submit="onSubmit"
    />

    <VDialog
      v-model="deleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardText>
          Bu kaydı silmek istediğinize emin misiniz?
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="deleteDialog = false"
          >
            Vazgeç
          </VBtn>
          <VBtn
            color="error"
            @click="doDelete"
          >
            Sil
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
