<script setup>
const floorHeight = ref(300)
const targetRise = ref(17)

const stepCount = computed(() => {
  const height = Number(floorHeight.value) || 0
  const target = Number(targetRise.value) || 17

  return Math.max(Math.round(height / target), 1)
})

const actualRise = computed(() => {
  const height = Number(floorHeight.value) || 0

  return stepCount.value ? height / stepCount.value : 0
})

// Blondel kuralı: 2×rise + run ≈ 63 cm (ideal aralık 60-65 cm)
const suggestedRun = computed(() => 63 - 2 * actualRise.value)

const riseIsIdeal = computed(() => actualRise.value >= 16 && actualRise.value <= 18)
</script>

<template>
  <VCard title="Merdiven Hesaplama">
    <VCardText>
      <p class="text-body-2 mb-4">
        Kat yüksekliğini girin, ideal basamak yüksekliği aralığına (16-18 cm) göre basamak sayısı ve
        Blondel kuralına göre önerilen basamak genişliği hesaplanır.
      </p>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="floorHeight"
            type="number"
            label="Kat Yüksekliği (cm)"
            placeholder="Örn. 300"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="targetRise"
            type="number"
            label="Hedef Basamak Yüksekliği (cm)"
            placeholder="16-18 arası önerilir"
          />
        </VCol>
      </VRow>

      <VDivider class="my-4" />

      <VRow>
        <VCol
          cols="12"
          sm="4"
        >
          <span class="text-body-2">Basamak Sayısı</span>
          <h5 class="text-h5">
            {{ stepCount }}
          </h5>
        </VCol>
        <VCol
          cols="12"
          sm="4"
        >
          <span class="text-body-2">Gerçek Basamak Yüksekliği (Rıht)</span>
          <h5
            class="text-h5"
            :class="riseIsIdeal ? 'text-success' : 'text-warning'"
          >
            {{ actualRise.toFixed(1) }} cm
          </h5>
        </VCol>
        <VCol
          cols="12"
          sm="4"
        >
          <span class="text-body-2">Önerilen Basamak Genişliği (Kova)</span>
          <h5 class="text-h5">
            {{ suggestedRun.toFixed(1) }} cm
          </h5>
        </VCol>
      </VRow>

      <VAlert
        v-if="!riseIsIdeal"
        color="warning"
        variant="tonal"
        class="mt-4"
      >
        Basamak yüksekliği ideal aralığın (16-18 cm) dışında. Hedef değeri değiştirmeyi deneyin.
      </VAlert>
    </VCardText>
  </VCard>
</template>
