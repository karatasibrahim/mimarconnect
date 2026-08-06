<script setup>
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/firestore'

const tenants = ref([])
const isLoading = ref(true)

onSnapshot(collection(db, 'tenants'), snap => {
  tenants.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  isLoading.value = false
})

const planOptions = [
  { title: 'Deneme', value: 'trial' },
  { title: 'Temel', value: 'basic' },
  { title: 'Pro', value: 'pro' },
]

const statusOptions = [
  { title: 'Aktif', value: 'active' },
  { title: 'Askıda', value: 'suspended' },
]

const updatePlan = async (tenant, plan) => {
  await updateDoc(doc(db, 'tenants', tenant.id), { plan })
}

const updateStatus = async (tenant, subscriptionStatus) => {
  await updateDoc(doc(db, 'tenants', tenant.id), { subscriptionStatus })
}

const headers = [
  { title: 'OFİS', key: 'name' },
  { title: 'SİTE ADRESİ', key: 'slug' },
  { title: 'PLAN', key: 'plan' },
  { title: 'DURUM', key: 'subscriptionStatus' },
]
</script>

<template>
  <VCard>
    <VDataTable
      :headers="headers"
      :items="tenants"
      :loading="isLoading"
      no-data-text="Kayıtlı ofis bulunamadı."
      loading-text="Yükleniyor..."
    >
      <template #item.slug="{ item }">
        {{ item.slug ? `/o/${item.slug}` : '—' }}
      </template>

      <template #item.plan="{ item }">
        <AppSelect
          :model-value="item.plan"
          :items="planOptions"
          density="compact"
          hide-details
          style="min-inline-size: 140px;"
          @update:model-value="val => updatePlan(item, val)"
        />
      </template>

      <template #item.subscriptionStatus="{ item }">
        <AppSelect
          :model-value="item.subscriptionStatus"
          :items="statusOptions"
          density="compact"
          hide-details
          style="min-inline-size: 140px;"
          @update:model-value="val => updateStatus(item, val)"
        />
      </template>
    </VDataTable>
  </VCard>
</template>
