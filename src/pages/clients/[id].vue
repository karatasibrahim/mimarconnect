<script setup>
import { onSnapshot, query, where } from 'firebase/firestore'
import { useTenant } from '@/composables/useTenant'

definePage({
  meta: {
    action: 'read',
    subject: 'Client',
  },
})

const route = useRoute('clients-id')
const { tenantId, tenantCollection, tenantDoc } = useTenant()

const client = ref(null)
const projects = ref([])
const quotes = ref([])

watch(tenantId, id => {
  if (!id)
    return

  onSnapshot(tenantDoc('clients', route.params.id), snap => {
    client.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
  })

  onSnapshot(query(tenantCollection('projects'), where('clientId', '==', route.params.id)), snap => {
    projects.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })

  onSnapshot(query(tenantCollection('quotes'), where('clientId', '==', route.params.id)), snap => {
    quotes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}, { immediate: true })
</script>

<template>
  <div v-if="client">
    <div class="d-flex align-center gap-3 mb-6">
      <VAvatar
        color="primary"
        variant="tonal"
        size="48"
      >
        {{ client.name?.[0]?.toUpperCase() }}
      </VAvatar>
      <div>
        <h4 class="text-h4">
          {{ client.name }}
        </h4>
        <span
          v-if="client.company"
          class="text-body-2"
        >{{ client.company }}</span>
      </div>
    </div>

    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VCard title="İletişim Bilgileri">
          <VCardText>
            <VList density="compact">
              <VListItem
                v-if="client.email"
                prepend-icon="tabler-mail"
                :title="client.email"
              />
              <VListItem
                v-if="client.phone"
                prepend-icon="tabler-phone"
                :title="client.phone"
              />
              <VListItem
                v-if="client.address"
                prepend-icon="tabler-map-pin"
                :title="client.address"
              />
            </VList>
            <p
              v-if="client.notes"
              class="text-body-2 mt-3"
            >
              {{ client.notes }}
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="8"
      >
        <VCard
          title="Projeler"
          class="mb-6"
        >
          <VList v-if="projects.length">
            <VListItem
              v-for="project in projects"
              :key="project.id"
              :to="{ name: 'projects-id', params: { id: project.id } }"
              :title="project.title"
              :subtitle="project.status"
            />
          </VList>
          <VCardText v-else>
            Bu müşteriye ait proje bulunmuyor.
          </VCardText>
        </VCard>

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
            Bu müşteriye ait teklif bulunmuyor.
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
