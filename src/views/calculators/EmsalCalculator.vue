<script setup>
const landArea = ref(null)
const emsal = ref(null)
const taks = ref(null)

const maxConstructionArea = computed(() => {
  const area = Number(landArea.value) || 0
  const ratio = Number(emsal.value) || 0

  return area * ratio
})

const maxFootprintArea = computed(() => {
  const area = Number(landArea.value) || 0
  const ratio = Number(taks.value) || 0

  return area * ratio
})
</script>

<template>
  <VCard title="Emsal (KAKS) / TAKS Hesaplama">
    <VCardText>
      <p class="text-body-2 mb-4">
        Arsa alanı ile emsal (KAKS) ve taban alanı katsayısını (TAKS) girerek izin verilen azami inşaat alanını hesaplayın.
      </p>
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model="landArea"
            type="number"
            label="Arsa Alanı (m²)"
            placeholder="Örn. 500"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model="emsal"
            type="number"
            step="0.05"
            label="Emsal (KAKS)"
            placeholder="Örn. 1.5"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model="taks"
            type="number"
            step="0.05"
            label="TAKS (opsiyonel)"
            placeholder="Örn. 0.4"
          />
        </VCol>
      </VRow>

      <VDivider class="my-4" />

      <VRow>
        <VCol
          cols="12"
          sm="6"
        >
          <span class="text-body-2">Azami Toplam İnşaat Alanı</span>
          <h5 class="text-h5">
            {{ maxConstructionArea.toLocaleString('tr-TR') }} m²
          </h5>
        </VCol>
        <VCol
          v-if="taks"
          cols="12"
          sm="6"
        >
          <span class="text-body-2">Azami Taban Oturma Alanı</span>
          <h5 class="text-h5">
            {{ maxFootprintArea.toLocaleString('tr-TR') }} m²
          </h5>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
