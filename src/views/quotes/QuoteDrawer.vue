<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import QuoteItemsEditor from '@/views/quotes/QuoteItemsEditor.vue'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  quoteData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'submit'])

const { items: clients } = useFirestoreCrud('clients')
const { items: projects } = useFirestoreCrud('projects')

const clientOptions = computed(() => clients.value.map(c => ({ title: c.name, value: c.id })))

const projectOptions = computed(() => projects.value
  .filter(p => !form.value.clientId || p.clientId === form.value.clientId)
  .map(p => ({ title: p.title, value: p.id })))

const statusOptions = [
  { title: 'Taslak', value: 'draft' },
  { title: 'Gönderildi', value: 'sent' },
  { title: 'Kabul Edildi', value: 'accepted' },
  { title: 'Reddedildi', value: 'rejected' },
]

const isFormValid = ref(false)
const refForm = ref()

const form = ref({
  clientId: null,
  projectId: null,
  status: 'draft',
  validUntil: '',
  items: [],
})

watch(() => props.isDrawerOpen, isOpen => {
  if (isOpen) {
    form.value = {
      clientId: props.quoteData?.clientId ?? null,
      projectId: props.quoteData?.projectId ?? null,
      status: props.quoteData?.status ?? 'draft',
      validUntil: props.quoteData?.validUntil ?? '',
      items: props.quoteData?.items ? props.quoteData.items.map(i => ({ ...i })) : [],
    }
  }
})

const total = computed(() => form.value.items
  .reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0))

const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.resetValidation()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('submit', {
        ...form.value,
        items: form.value.items.map(i => ({
          description: i.description,
          qty: Number(i.qty) || 0,
          unitPrice: Number(i.unitPrice) || 0,
        })),
        total: total.value,
      })
      closeNavigationDrawer()
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    data-allow-mismatch
    temporary
    :width="500"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <AppDrawerHeaderSection
      :title="props.quoteData ? 'Teklifi Düzenle' : 'Yeni Teklif'"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="form.clientId"
                  label="Müşteri"
                  placeholder="Müşteri seçin"
                  :items="clientOptions"
                  :rules="[requiredValidator]"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="form.projectId"
                  label="Proje (opsiyonel)"
                  placeholder="Proje seçin"
                  clearable
                  :items="projectOptions"
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="form.status"
                  label="Durum"
                  :items="statusOptions"
                />
              </VCol>

              <VCol cols="12">
                <AppDateTimePicker
                  v-model="form.validUntil"
                  label="Geçerlilik Tarihi"
                  placeholder="Tarih seçin"
                  :config="{ dateFormat: 'Y-m-d' }"
                />
              </VCol>

              <VCol cols="12">
                <QuoteItemsEditor v-model="form.items" />
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-3"
                >
                  Kaydet
                </VBtn>
                <VBtn
                  type="reset"
                  variant="tonal"
                  color="error"
                  @click="closeNavigationDrawer"
                >
                  Vazgeç
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
