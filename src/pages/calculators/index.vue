<script setup>
import EmsalCalculator from '@/views/calculators/EmsalCalculator.vue'
import StaircaseCalculator from '@/views/calculators/StaircaseCalculator.vue'
import UnitConverter from '@/views/calculators/UnitConverter.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Calculator',
  },
})

const activeTab = ref('emsal')
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Hesap Araçları
    </h4>

    <VTabs
      v-model="activeTab"
      class="mb-6"
    >
      <VTab value="emsal">
        Emsal / TAKS
      </VTab>
      <VTab value="unit">
        Birim Dönüştürücü
      </VTab>
      <VTab value="staircase">
        Merdiven
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <VWindowItem value="emsal">
        <EmsalCalculator />
      </VWindowItem>
      <VWindowItem value="unit">
        <UnitConverter />
      </VWindowItem>
      <VWindowItem value="staircase">
        <StaircaseCalculator />
      </VWindowItem>
    </VWindow>
  </div>
</template>
