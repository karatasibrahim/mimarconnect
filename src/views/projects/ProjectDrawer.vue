<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useFirestoreCrud } from '@/composables/useFirestoreCrud'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  projectData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'submit'])

const { items: clients } = useFirestoreCrud('clients')

const clientOptions = computed(() => clients.value.map(c => ({ title: c.name, value: c.id })))

const statusOptions = [
  { title: 'Planlama', value: 'planning' },
  { title: 'Devam Ediyor', value: 'in_progress' },
  { title: 'Tamamlandı', value: 'completed' },
  { title: 'Beklemede', value: 'on_hold' },
]

const isFormValid = ref(false)
const refForm = ref()

const form = ref({
  title: '',
  clientId: null,
  status: 'planning',
  budget: null,
  description: '',
  isPublic: false,
})

watch(() => props.isDrawerOpen, isOpen => {
  if (isOpen) {
    form.value = {
      title: props.projectData?.title ?? '',
      clientId: props.projectData?.clientId ?? null,
      status: props.projectData?.status ?? 'planning',
      budget: props.projectData?.budget ?? null,
      description: props.projectData?.description ?? '',
      isPublic: props.projectData?.isPublic ?? false,
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
      emit('submit', { ...form.value, budget: form.value.budget ? Number(form.value.budget) : null })
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
      :title="props.projectData ? 'Projeyi Düzenle' : 'Yeni Proje'"
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
                <AppTextField
                  v-model="form.title"
                  :rules="[requiredValidator]"
                  label="Proje Adı"
                  placeholder="Örn. Villa Projesi"
                  autofocus
                />
              </VCol>

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
                  v-model="form.status"
                  label="Durum"
                  :items="statusOptions"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.budget"
                  type="number"
                  label="Bütçe (₺)"
                  placeholder="0"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="form.description"
                  label="Açıklama"
                  rows="3"
                />
              </VCol>

              <VCol cols="12">
                <VSwitch
                  v-model="form.isPublic"
                  label="Herkese açık sitede göster"
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
