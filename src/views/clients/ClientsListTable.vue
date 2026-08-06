<script setup>
import ClientDrawer from '@/views/clients/ClientDrawer.vue'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const { items: clients, isLoading, add, update, remove } = useFirestoreCrud('clients')

const searchQuery = ref('')

const filteredClients = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return clients.value

  return clients.value.filter(c =>
    [c.name, c.company, c.email, c.phone].some(field => field?.toLowerCase().includes(q)),
  )
})

const isDrawerOpen = ref(false)
const editingClient = ref(null)

const openAddDrawer = () => {
  editingClient.value = null
  isDrawerOpen.value = true
}

const openEditDrawer = client => {
  editingClient.value = client
  isDrawerOpen.value = true
}

const onSubmit = async payload => {
  if (editingClient.value)
    await update(editingClient.value.id, payload)
  else
    await add(payload)
}

const deleteDialog = ref(false)
const clientToDelete = ref(null)

const confirmDelete = client => {
  clientToDelete.value = client
  deleteDialog.value = true
}

const doDelete = async () => {
  if (clientToDelete.value)
    await remove(clientToDelete.value.id)
  deleteDialog.value = false
  clientToDelete.value = null
}

const headers = [
  { title: 'AD / FİRMA', key: 'name' },
  { title: 'ŞİRKET', key: 'company' },
  { title: 'E-POSTA', key: 'email' },
  { title: 'TELEFON', key: 'phone' },
  { title: 'AKSİYONLAR', key: 'actions', sortable: false, align: 'end' },
]
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 align-center justify-space-between">
        <AppTextField
          v-model="searchQuery"
          placeholder="Müşteri ara..."
          style="max-inline-size: 300px; min-inline-size: 250px;"
        />

        <VBtn
          v-if="$can('create', 'Client')"
          prepend-icon="tabler-plus"
          @click="openAddDrawer"
        >
          Yeni Müşteri
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filteredClients"
        :loading="isLoading"
        no-data-text="Kayıtlı müşteri bulunamadı."
        loading-text="Yükleniyor..."
      >
        <template #item.name="{ item }">
          <RouterLink
            :to="{ name: 'clients-id', params: { id: item.id } }"
            class="font-weight-medium text-link"
          >
            {{ item.name }}
          </RouterLink>
        </template>

        <template #item.actions="{ item }">
          <IconBtn
            v-if="$can('update', 'Client')"
            @click="openEditDrawer(item)"
          >
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn
            v-if="$can('delete', 'Client')"
            @click="confirmDelete(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <ClientDrawer
      v-model:is-drawer-open="isDrawerOpen"
      :client-data="editingClient"
      @submit="onSubmit"
    />

    <VDialog
      v-model="deleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardText>
          <strong>{{ clientToDelete?.name }}</strong> müşterisini silmek istediğinize emin misiniz?
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
