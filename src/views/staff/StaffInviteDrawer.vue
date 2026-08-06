<script setup>
import { httpsCallable } from 'firebase/functions'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { functions } from '@/firebase/functions'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isDrawerOpen', 'invited'])

const roleOptions = [
  { title: 'Yönetici', value: 'admin' },
  { title: 'Personel', value: 'editor' },
  { title: 'İzleyici', value: 'viewer' },
]

const isFormValid = ref(false)
const refForm = ref()
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = ref({
  email: '',
  role: 'editor',
})

watch(() => props.isDrawerOpen, isOpen => {
  if (isOpen) {
    form.value = { email: '', role: 'editor' }
    errorMessage.value = ''
  }
})

const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.resetValidation()
  })
}

const FUNCTIONS_ERROR_MESSAGES = {
  'already-exists': 'Bu e-posta adresi zaten bir ofise kayıtlı.',
  'permission-denied': 'Personel davet etme yetkiniz yok.',
}

const onSubmit = () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (!valid)
      return

    isSubmitting.value = true
    errorMessage.value = ''

    try {
      const result = await httpsCallable(functions, 'inviteStaffMember')({
        email: form.value.email,
        role: form.value.role,
      })

      const { tenantId, token } = result.data
      const link = `${window.location.origin}/accept-invite?tenant=${tenantId}&token=${token}`

      emit('invited', { link, email: form.value.email })
      closeNavigationDrawer()
    }
    catch (err) {
      errorMessage.value = FUNCTIONS_ERROR_MESSAGES[err.code?.replace('functions/', '')] || 'Davet gönderilemedi.'
    }
    finally {
      isSubmitting.value = false
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
      title="Personel Davet Et"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VAlert
            v-if="errorMessage"
            color="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>

          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="E-posta"
                  placeholder="personel@ornek.com"
                  autofocus
                />
              </VCol>

              <VCol cols="12">
                <AppSelect
                  v-model="form.role"
                  label="Rol"
                  :items="roleOptions"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-3"
                  :loading="isSubmitting"
                >
                  Davet Gönder
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
