<script setup>
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const { items: measurements, add, remove } = useFirestoreCrud('measurements')
const { items: projects } = useFirestoreCrud('projects')

const projectOptions = computed(() => projects.value.map(p => ({ title: p.title, value: p.id })))
const projectFilter = ref(null)

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const mapReady = ref(false)

const pendingFeature = ref(null)
const pendingValue = ref(0)
const pendingUnit = ref('')
const pendingLabel = ref('')
const saveDialog = ref(false)

const SOURCE_ID = 'saved-measurements'

const featureCollectionFromMeasurements = () => ({
  type: 'FeatureCollection',
  features: measurements.value
    .filter(m => !projectFilter.value || m.projectId === projectFilter.value)
    .map(m => ({ type: 'Feature', geometry: m.geometry, properties: { id: m.id, label: m.label, value: m.value, unit: m.unit } })),
})

const refreshSavedLayer = () => {
  if (!mapReady.value)
    return

  const source = map.value.getSource(SOURCE_ID)
  if (source)
    source.setData(featureCollectionFromMeasurements())
}

watch(measurements, refreshSavedLayer)
watch(projectFilter, refreshSavedLayer)

onMounted(() => {
  if (!accessToken) {
    return
  }

  mapboxgl.accessToken = accessToken

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [35.0, 39.0],
    zoom: 5,
  })

  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')

  draw.value = new MapboxDraw({
    displayControlsDefault: false,
    controls: { polygon: true, line_string: true, point: true, trash: true },
  })
  map.value.addControl(draw.value, 'top-left')

  map.value.on('load', () => {
    map.value.addSource(SOURCE_ID, { type: 'geojson', data: featureCollectionFromMeasurements() })

    map.value.addLayer({
      id: `${SOURCE_ID}-fill`,
      type: 'fill',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#7367F0', 'fill-opacity': 0.2 },
    })
    map.value.addLayer({
      id: `${SOURCE_ID}-line`,
      type: 'line',
      source: SOURCE_ID,
      paint: { 'line-color': '#7367F0', 'line-width': 2 },
    })
    map.value.addLayer({
      id: `${SOURCE_ID}-point`,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-color': '#7367F0', 'circle-radius': 6 },
    })

    mapReady.value = true
  })

  const onDrawChange = e => {
    const feature = e.features?.[0]
    if (!feature) {
      pendingFeature.value = null

      return
    }

    pendingFeature.value = feature

    if (feature.geometry.type === 'Polygon') {
      pendingValue.value = turf.area(feature)
      pendingUnit.value = 'm²'
    }
    else if (feature.geometry.type === 'LineString') {
      pendingValue.value = turf.length(feature, { units: 'meters' })
      pendingUnit.value = 'm'
    }
    else {
      pendingValue.value = 0
      pendingUnit.value = 'nokta'
    }

    pendingLabel.value = ''
    saveDialog.value = true
  }

  map.value.on('draw.create', onDrawChange)
  map.value.on('draw.update', onDrawChange)
  map.value.on('draw.delete', () => {
    pendingFeature.value = null
  })
})

onBeforeUnmount(() => {
  map.value?.remove()
})

const saveMeasurement = async () => {
  if (!pendingFeature.value)
    return

  await add({
    type: pendingFeature.value.geometry.type === 'Polygon' ? 'area' : pendingFeature.value.geometry.type === 'LineString' ? 'distance' : 'point',
    geometry: pendingFeature.value.geometry,
    value: pendingValue.value,
    unit: pendingUnit.value,
    label: pendingLabel.value || 'Adsız ölçüm',
    projectId: projectFilter.value,
  })

  draw.value.deleteAll()
  pendingFeature.value = null
  saveDialog.value = false
}

const cancelPending = () => {
  draw.value?.deleteAll()
  pendingFeature.value = null
  saveDialog.value = false
}

const deleteMeasurement = async id => {
  await remove(id)
}
</script>

<template>
  <div>
    <VAlert
      v-if="!accessToken"
      color="warning"
      variant="tonal"
      class="mb-4"
    >
      Harita görüntülenemiyor: Mapbox erişim token'ı tanımlı değil. <code>.env</code> dosyasındaki
      <code>VITE_MAPBOX_ACCESS_TOKEN</code> değişkenini doldurun.
    </VAlert>

    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <AppSelect
          v-model="projectFilter"
          label="Projeye göre filtrele"
          placeholder="Tüm ölçümler"
          clearable
          :items="projectOptions"
          style="min-inline-size: 260px;"
        />
        <span class="text-body-2">
          Sol üstteki araçlarla alan (poligon), mesafe (çizgi) veya nokta çizin; çizim bitince kaydetme penceresi açılır.
        </span>
      </VCardText>
    </VCard>

    <VCard>
      <div
        ref="mapContainer"
        style="block-size: 520px; inline-size: 100%;"
      />
    </VCard>

    <VCard
      v-if="measurements.length"
      title="Kayıtlı Ölçümler"
      class="mt-4"
    >
      <VList>
        <VListItem
          v-for="m in measurements"
          :key="m.id"
        >
          <VListItemTitle>{{ m.label }}</VListItemTitle>
          <VListItemSubtitle>
            {{ m.value?.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) }} {{ m.unit }}
          </VListItemSubtitle>
          <template #append>
            <IconBtn
              v-if="$can('delete', 'Measurement')"
              @click="deleteMeasurement(m.id)"
            >
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </template>
        </VListItem>
      </VList>
    </VCard>

    <VDialog
      v-model="saveDialog"
      max-width="420"
      persistent
    >
      <VCard title="Ölçümü Kaydet">
        <VCardText>
          <p class="mb-3">
            Hesaplanan değer:
            <strong>{{ pendingValue.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) }} {{ pendingUnit }}</strong>
          </p>
          <AppTextField
            v-model="pendingLabel"
            label="Etiket"
            placeholder="Örn. Bahçe alanı, Cephe uzunluğu"
            autofocus
          />
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="cancelPending"
          >
            Vazgeç
          </VBtn>
          <VBtn @click="saveMeasurement">
            Kaydet
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style>
@import "mapbox-gl/dist/mapbox-gl.css";
@import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
</style>
