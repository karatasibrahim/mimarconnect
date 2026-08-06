<script setup>
import { useAuthStore } from '@/stores/auth'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

definePage({
  meta: {
    action: 'read',
    subject: 'Dashboard',
  },
})

const authStore = useAuthStore()

const { items: projects } = useFirestoreCrud('projects')
const { items: clients } = useFirestoreCrud('clients')
const { items: quotes } = useFirestoreCrud('quotes')
const { items: transactions } = useFirestoreCrud('transactions')

const summaryCards = computed(() => [
  { title: 'Projeler', count: projects.value.length, icon: 'tabler-building-skyscraper', color: 'primary', to: { name: 'projects' } },
  { title: 'Müşteriler', count: clients.value.length, icon: 'tabler-users', color: 'success', to: { name: 'clients' } },
  { title: 'Teklifler', count: quotes.value.length, icon: 'tabler-file-invoice', color: 'warning', to: { name: 'quotes' } },
])

const netBalance = computed(() => transactions.value.reduce(
  (sum, t) => sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0)),
  0,
))
</script>

<template>
  <div>
    <h4 class="text-h4 mb-1">
      Merhaba, {{ authStore.userDoc?.displayName || authStore.user?.email }} 👋
    </h4>
    <p class="text-body-1 mb-6">
      {{ authStore.tenant?.name }} ofisinizin özeti
    </p>

    <VRow>
      <VCol
        v-for="card in summaryCards"
        :key="card.title"
        cols="12"
        sm="6"
        md="4"
      >
        <VCard
          :to="card.to"
          class="cursor-pointer"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              :color="card.color"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                :icon="card.icon"
                size="26"
              />
            </VAvatar>
            <div>
              <h5 class="text-h5">
                {{ card.count }}
              </h5>
              <span class="text-body-2">{{ card.title }}</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="4"
      >
        <VCard
          :to="{ name: 'accounting' }"
          class="cursor-pointer"
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              :color="netBalance >= 0 ? 'success' : 'error'"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-report-money"
                size="26"
              />
            </VAvatar>
            <div>
              <h5
                class="text-h5"
                :class="netBalance >= 0 ? 'text-success' : 'text-error'"
              >
                {{ netBalance.toLocaleString('tr-TR') }} ₺
              </h5>
              <span class="text-body-2">Net Bakiye</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
