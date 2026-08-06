<script setup>
import MapMeasurementTool from '@/views/map/MapMeasurementTool.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Measurement',
  },
})
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Harita — Ölçüm ve Noktalama
    </h4>
    <MapMeasurementTool />
  </div>
</template>
