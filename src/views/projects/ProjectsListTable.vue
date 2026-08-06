<script setup>
import ProjectDrawer from '@/views/projects/ProjectDrawer.vue'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const { items: projects, isLoading, add, update, remove } = useFirestoreCrud('projects')
const { items: clients } = useFirestoreCrud('clients')

const clientName = id => clients.value.find(c => c.id === id)?.name ?? '—'

const STATUS_LABELS = {
  planning: { text: 'Planlama', color: 'info' },
  in_progress: { text: 'Devam Ediyor', color: 'warning' },
  completed: { text: 'Tamamlandı', color: 'success' },
  on_hold: { text: 'Beklemede', color: 'secondary' },
}

const searchQuery = ref('')

const filteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q)
    return projects.value

  return projects.value.filter(p => p.title?.toLowerCase().includes(q))
})

const isDrawerOpen = ref(false)
const editingProject = ref(null)

const openAddDrawer = () => {
  editingProject.value = null
  isDrawerOpen.value = true
}

const openEditDrawer = project => {
  editingProject.value = project
  isDrawerOpen.value = true
}

const onSubmit = async payload => {
  if (editingProject.value)
    await update(editingProject.value.id, payload)
  else
    await add(payload)
}

const deleteDialog = ref(false)
const projectToDelete = ref(null)

const confirmDelete = project => {
  projectToDelete.value = project
  deleteDialog.value = true
}

const doDelete = async () => {
  if (projectToDelete.value)
    await remove(projectToDelete.value.id)
  deleteDialog.value = false
  projectToDelete.value = null
}

const headers = [
  { title: 'PROJE', key: 'title' },
  { title: 'MÜŞTERİ', key: 'clientId' },
  { title: 'DURUM', key: 'status' },
  { title: 'BÜTÇE', key: 'budget' },
  { title: 'AKSİYONLAR', key: 'actions', sortable: false, align: 'end' },
]
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 align-center justify-space-between">
        <AppTextField
          v-model="searchQuery"
          placeholder="Proje ara..."
          style="max-inline-size: 300px; min-inline-size: 250px;"
        />

        <VBtn
          v-if="$can('create', 'Project')"
          prepend-icon="tabler-plus"
          @click="openAddDrawer"
        >
          Yeni Proje
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filteredProjects"
        :loading="isLoading"
        no-data-text="Kayıtlı proje bulunamadı."
        loading-text="Yükleniyor..."
      >
        <template #item.title="{ item }">
          <RouterLink
            :to="{ name: 'projects-id', params: { id: item.id } }"
            class="font-weight-medium text-link"
          >
            {{ item.title }}
          </RouterLink>
          <VIcon
            v-if="item.isPublic"
            icon="tabler-world"
            size="16"
            color="success"
            class="ms-1"
          />
        </template>

        <template #item.clientId="{ item }">
          {{ clientName(item.clientId) }}
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="STATUS_LABELS[item.status]?.color"
            size="small"
          >
            {{ STATUS_LABELS[item.status]?.text ?? item.status }}
          </VChip>
        </template>

        <template #item.budget="{ item }">
          {{ item.budget ? `${item.budget.toLocaleString('tr-TR')} ₺` : '—' }}
        </template>

        <template #item.actions="{ item }">
          <IconBtn
            v-if="$can('update', 'Project')"
            @click="openEditDrawer(item)"
          >
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn
            v-if="$can('delete', 'Project')"
            @click="confirmDelete(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <ProjectDrawer
      v-model:is-drawer-open="isDrawerOpen"
      :project-data="editingProject"
      @submit="onSubmit"
    />

    <VDialog
      v-model="deleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardText>
          <strong>{{ projectToDelete?.title }}</strong> projesini silmek istediğinize emin misiniz?
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
