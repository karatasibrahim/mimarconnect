<script setup>
import QuoteDrawer from '@/views/quotes/QuoteDrawer.vue'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const { items: quotes, isLoading, add, update, remove } = useFirestoreCrud('quotes')
const { items: clients } = useFirestoreCrud('clients')

const clientName = id => clients.value.find(c => c.id === id)?.name ?? '—'

const STATUS_LABELS = {
  draft: { text: 'Taslak', color: 'secondary' },
  sent: { text: 'Gönderildi', color: 'info' },
  accepted: { text: 'Kabul Edildi', color: 'success' },
  rejected: { text: 'Reddedildi', color: 'error' },
}

const isDrawerOpen = ref(false)
const editingQuote = ref(null)

const openAddDrawer = () => {
  editingQuote.value = null
  isDrawerOpen.value = true
}

const openEditDrawer = quote => {
  editingQuote.value = quote
  isDrawerOpen.value = true
}

const onSubmit = async payload => {
  if (editingQuote.value)
    await update(editingQuote.value.id, payload)
  else
    await add(payload)
}

const deleteDialog = ref(false)
const quoteToDelete = ref(null)

const confirmDelete = quote => {
  quoteToDelete.value = quote
  deleteDialog.value = true
}

const doDelete = async () => {
  if (quoteToDelete.value)
    await remove(quoteToDelete.value.id)
  deleteDialog.value = false
  quoteToDelete.value = null
}

const headers = [
  { title: 'MÜŞTERİ', key: 'clientId' },
  { title: 'TUTAR', key: 'total' },
  { title: 'DURUM', key: 'status' },
  { title: 'GEÇERLİLİK', key: 'validUntil' },
  { title: 'AKSİYONLAR', key: 'actions', sortable: false, align: 'end' },
]
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex justify-end">
        <VBtn
          v-if="$can('create', 'Quote')"
          prepend-icon="tabler-plus"
          @click="openAddDrawer"
        >
          Yeni Teklif
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="quotes"
        :loading="isLoading"
        no-data-text="Kayıtlı teklif bulunamadı."
        loading-text="Yükleniyor..."
      >
        <template #item.clientId="{ item }">
          <RouterLink
            :to="{ name: 'quotes-id', params: { id: item.id } }"
            class="font-weight-medium text-link"
          >
            {{ clientName(item.clientId) }}
          </RouterLink>
        </template>

        <template #item.total="{ item }">
          {{ (item.total ?? 0).toLocaleString('tr-TR') }} ₺
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="STATUS_LABELS[item.status]?.color"
            size="small"
          >
            {{ STATUS_LABELS[item.status]?.text ?? item.status }}
          </VChip>
        </template>

        <template #item.validUntil="{ item }">
          {{ item.validUntil || '—' }}
        </template>

        <template #item.actions="{ item }">
          <IconBtn
            v-if="$can('update', 'Quote')"
            @click="openEditDrawer(item)"
          >
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn
            v-if="$can('delete', 'Quote')"
            @click="confirmDelete(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <QuoteDrawer
      v-model:is-drawer-open="isDrawerOpen"
      :quote-data="editingQuote"
      @submit="onSubmit"
    />

    <VDialog
      v-model="deleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardText>
          Bu teklifi silmek istediğinize emin misiniz?
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
