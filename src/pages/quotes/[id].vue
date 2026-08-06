<script setup>
import { addDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { useTenant } from '@/composables/useTenant'

definePage({
  meta: {
    action: 'read',
    subject: 'Quote',
  },
})

const route = useRoute('quotes-id')
const { tenantId, tenantDoc, tenantCollection } = useTenant()
const authStore = useAuthStore()

const quote = ref(null)
const client = ref(null)
const project = ref(null)
const isRecordingPayment = ref(false)

const recordPayment = async () => {
  isRecordingPayment.value = true
  try {
    await addDoc(tenantCollection('transactions'), {
      type: 'income',
      amount: quote.value.total ?? 0,
      category: 'Teklif Tahsilatı',
      description: `${client.value?.name ?? ''} — teklif tahsilatı`,
      date: new Date().toISOString().slice(0, 10),
      projectId: quote.value.projectId ?? null,
      createdBy: authStore.user?.uid ?? null,
      createdAt: serverTimestamp(),
    })
    await updateDoc(tenantDoc('quotes', route.params.id), { paymentRecorded: true })
  }
  finally {
    isRecordingPayment.value = false
  }
}

const STATUS_LABELS = {
  draft: { text: 'Taslak', color: 'secondary' },
  sent: { text: 'Gönderildi', color: 'info' },
  accepted: { text: 'Kabul Edildi', color: 'success' },
  rejected: { text: 'Reddedildi', color: 'error' },
}

watch(tenantId, id => {
  if (!id)
    return

  onSnapshot(tenantDoc('quotes', route.params.id), snap => {
    quote.value = snap.exists() ? { id: snap.id, ...snap.data() } : null

    if (quote.value?.clientId) {
      onSnapshot(tenantDoc('clients', quote.value.clientId), s => {
        client.value = s.exists() ? { id: s.id, ...s.data() } : null
      })
    }

    if (quote.value?.projectId) {
      onSnapshot(tenantDoc('projects', quote.value.projectId), s => {
        project.value = s.exists() ? { id: s.id, ...s.data() } : null
      })
    }
  })
}, { immediate: true })
</script>

<template>
  <div v-if="quote">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4">
          Teklif — {{ client?.name }}
        </h4>
        <RouterLink
          v-if="project"
          :to="{ name: 'projects-id', params: { id: project.id } }"
          class="text-body-2 text-link"
        >
          {{ project.title }}
        </RouterLink>
      </div>
      <div class="d-flex align-center gap-3">
        <VBtn
          v-if="quote.status === 'accepted' && !quote.paymentRecorded && $can('create', 'Transaction')"
          prepend-icon="tabler-cash"
          :loading="isRecordingPayment"
          @click="recordPayment"
        >
          Ödeme Kaydet
        </VBtn>
        <VChip
          v-if="quote.paymentRecorded"
          color="success"
          variant="tonal"
        >
          Tahsilat Kaydedildi
        </VChip>
        <VChip :color="STATUS_LABELS[quote.status]?.color">
          {{ STATUS_LABELS[quote.status]?.text ?? quote.status }}
        </VChip>
      </div>
    </div>

    <VCard title="Kalemler">
      <VTable>
        <thead>
          <tr>
            <th>Açıklama</th>
            <th>Adet</th>
            <th>Birim Fiyat</th>
            <th>Tutar</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in quote.items"
            :key="index"
          >
            <td>{{ item.description }}</td>
            <td>{{ item.qty }}</td>
            <td>{{ item.unitPrice.toLocaleString('tr-TR') }} ₺</td>
            <td>{{ (item.qty * item.unitPrice).toLocaleString('tr-TR') }} ₺</td>
          </tr>
        </tbody>
      </VTable>
      <VCardText class="text-end text-h6">
        Toplam: {{ (quote.total ?? 0).toLocaleString('tr-TR') }} ₺
      </VCardText>
    </VCard>
  </div>
</template>
