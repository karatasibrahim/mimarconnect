<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  transactionData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'submit'])

const { items: projects } = useFirestoreCrud('projects')

const projectOptions = computed(() => projects.value.map(p => ({ title: p.title, value: p.id })))

const typeOptions = [
  { title: 'Gelir', value: 'income' },
  { title: 'Gider', value: 'expense' },
]

const isFormValid = ref(false)
const refForm = ref()

const form = ref({
  type: 'income',
  amount: null,
  category: '',
  description: '',
  date: '',
  projectId: null,
})

watch(() => props.isDrawerOpen, isOpen => {
  if (isOpen) {
    form.value = {
      type: props.transactionData?.type ?? 'income',
      amount: props.transactionData?.amount ?? null,
      category: props.transactionData?.category ?? '',
      description: props.transactionData?.description ?? '',
      date: props.transactionData?.date ?? new Date().toISOString().slice(0, 10),
      projectId: props.transactionData?.projectId ?? null,
    }
  }
})

const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.resetValidation()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      emit('submit', { ...form.value, amount: Number(form.value.amount) || 0 })
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
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <AppDrawerHeaderSection
      :title="props.transactionData ? 'Kaydı Düzenle' : 'Yeni Gelir/Gider'"
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
                  v-model="form.type"
                  label="Tür"
                  :items="typeOptions"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.amount"
                  type="number"
                  :rules="[requiredValidator]"
                  label="Tutar (₺)"
                  placeholder="0"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.category"
                  :rules="[requiredValidator]"
                  label="Kategori"
                  placeholder="Örn. Proje Bedeli, Ofis Gideri"
                />
              </VCol>

              <VCol cols="12">
                <AppDateTimePicker
                  v-model="form.date"
                  label="Tarih"
                  :config="{ dateFormat: 'Y-m-d' }"
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
                <AppTextarea
                  v-model="form.description"
                  label="Açıklama"
                  rows="2"
                />
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
