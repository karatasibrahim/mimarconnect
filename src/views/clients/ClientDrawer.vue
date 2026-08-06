<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  clientData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'submit'])

const isFormValid = ref(false)
const refForm = ref()

const form = ref({
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
})

watch(() => props.isDrawerOpen, isOpen => {
  if (isOpen) {
    form.value = {
      name: props.clientData?.name ?? '',
      company: props.clientData?.company ?? '',
      email: props.clientData?.email ?? '',
      phone: props.clientData?.phone ?? '',
      address: props.clientData?.address ?? '',
      notes: props.clientData?.notes ?? '',
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
      emit('submit', { ...form.value })
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
      :title="props.clientData ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'"
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
                  v-model="form.name"
                  :rules="[requiredValidator]"
                  label="Ad Soyad / Firma"
                  placeholder="Örn. Ahmet Yılmaz"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.company"
                  label="Şirket"
                  placeholder="Örn. Yılmaz İnşaat A.Ş."
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :rules="form.email ? [emailValidator] : []"
                  label="E-posta"
                  placeholder="ornek@musteri.com"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.phone"
                  label="Telefon"
                  placeholder="+90 5xx xxx xx xx"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.address"
                  label="Adres"
                />
              </VCol>

              <VCol cols="12">
                <AppTextarea
                  v-model="form.notes"
                  label="Notlar"
                  rows="3"
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
