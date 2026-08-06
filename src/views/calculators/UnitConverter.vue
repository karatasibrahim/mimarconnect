<script setup>
const CONVERSIONS = {
  'm2-ft2': { label: 'm² → ft²', factor: 10.7639 },
  'ft2-m2': { label: 'ft² → m²', factor: 1 / 10.7639 },
  'm-ft': { label: 'metre → feet', factor: 3.28084 },
  'ft-m': { label: 'feet → metre', factor: 1 / 3.28084 },
  'm-cm': { label: 'metre → santimetre', factor: 100 },
  'cm-m': { label: 'santimetre → metre', factor: 0.01 },
}

const conversionKey = ref('m2-ft2')
const inputValue = ref(null)

const conversionOptions = Object.entries(CONVERSIONS).map(([value, { label }]) => ({ title: label, value }))

const result = computed(() => (Number(inputValue.value) || 0) * CONVERSIONS[conversionKey.value].factor)
</script>

<template>
  <VCard title="Birim Dönüştürücü">
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <AppSelect
            v-model="conversionKey"
            label="Dönüşüm"
            :items="conversionOptions"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model="inputValue"
            type="number"
            label="Değer"
            placeholder="0"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <span class="text-body-2">Sonuç</span>
          <h5 class="text-h5">
            {{ result.toLocaleString('tr-TR', { maximumFractionDigits: 4 }) }}
          </h5>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
