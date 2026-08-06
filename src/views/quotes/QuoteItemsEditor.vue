<script setup>
const items = defineModel({ default: () => [] })

const addItem = () => {
  items.value = [...items.value, { description: '', qty: 1, unitPrice: 0 }]
}

const removeItem = index => {
  items.value = items.value.filter((_, i) => i !== index)
}

const lineTotal = item => (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)

const total = computed(() => items.value.reduce((sum, item) => sum + lineTotal(item), 0))

defineExpose({ total })
</script>

<template>
  <div>
    <VTable density="compact">
      <thead>
        <tr>
          <th>Açıklama</th>
          <th style="inline-size: 90px;">
            Adet
          </th>
          <th style="inline-size: 130px;">
            Birim Fiyat
          </th>
          <th style="inline-size: 120px;">
            Tutar
          </th>
          <th style="inline-size: 48px;" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in items"
          :key="index"
        >
          <td>
            <AppTextField
              v-model="item.description"
              density="compact"
              placeholder="Kalem açıklaması"
              hide-details
            />
          </td>
          <td>
            <AppTextField
              v-model="item.qty"
              type="number"
              density="compact"
              hide-details
            />
          </td>
          <td>
            <AppTextField
              v-model="item.unitPrice"
              type="number"
              density="compact"
              hide-details
            />
          </td>
          <td>{{ lineTotal(item).toLocaleString('tr-TR') }} ₺</td>
          <td>
            <IconBtn @click="removeItem(index)">
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </td>
        </tr>
      </tbody>
    </VTable>

    <VBtn
      variant="tonal"
      size="small"
      prepend-icon="tabler-plus"
      class="mt-3"
      @click="addItem"
    >
      Kalem Ekle
    </VBtn>

    <div class="text-end text-h6 mt-4">
      Toplam: {{ total.toLocaleString('tr-TR') }} ₺
    </div>
  </div>
</template>
