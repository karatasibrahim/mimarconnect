<script setup>
import { onSnapshot, query, where } from 'firebase/firestore'
import { useTenant } from '@/composables/useTenant'

definePage({
  meta: {
    action: 'read',
    subject: 'Project',
  },
})

const route = useRoute('projects-id')
const { tenantId, tenantCollection, tenantDoc } = useTenant()

const project = ref(null)
const client = ref(null)
const quotes = ref([])

const STATUS_LABELS = {
  planning: { text: 'Planlama', color: 'info' },
  in_progress: { text: 'Devam Ediyor', color: 'warning' },
  completed: { text: 'Tamamlandı', color: 'success' },
  on_hold: { text: 'Beklemede', color: 'secondary' },
}

watch(tenantId, id => {
  if (!id)
    return

  onSnapshot(tenantDoc('projects', route.params.id), snap => {
    project.value = snap.exists() ? { id: snap.id, ...snap.data() } : null

    if (project.value?.clientId) {
      onSnapshot(tenantDoc('clients', project.value.clientId), clientSnap => {
        client.value = clientSnap.exists() ? { id: clientSnap.id, ...clientSnap.data() } : null
      })
    }
  })

  onSnapshot(query(tenantCollection('quotes'), where('projectId', '==', route.params.id)), snap => {
    quotes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}, { immediate: true })
</script>

<template>
  <div v-if="project">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4">
          {{ project.title }}
        </h4>
        <RouterLink
          v-if="client"
          :to="{ name: 'clients-id', params: { id: client.id } }"
          class="text-body-2 text-link"
        >
          {{ client.name }}
        </RouterLink>
      </div>
      <VChip :color="STATUS_LABELS[project.status]?.color">
        {{ STATUS_LABELS[project.status]?.text ?? project.status }}
      </VChip>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VCard title="Proje Bilgileri">
          <VCardText>
            <p v-if="project.budget">
              <strong>Bütçe:</strong> {{ project.budget.toLocaleString('tr-TR') }} ₺
            </p>
            <p
              v-if="project.description"
              class="text-body-2"
            >
              {{ project.description }}
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="8"
      >
        <VCard title="Teklifler">
          <VList v-if="quotes.length">
            <VListItem
              v-for="quote in quotes"
              :key="quote.id"
              :to="{ name: 'quotes-id', params: { id: quote.id } }"
              :title="`Teklif — ${quote.total ?? 0} ₺`"
              :subtitle="quote.status"
            />
          </VList>
          <VCardText v-else>
            Bu projeye ait teklif bulunmuyor.
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
