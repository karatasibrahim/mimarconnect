<script setup>
import { VForm } from 'vuetify/components/VForm'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAuthStore } from '@/stores/auth'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const tenantId = computed(() => String(route.query.tenant || ''))
const token = computed(() => String(route.query.token || ''))
const linkIsValid = computed(() => !!tenantId.value && !!token.value)

const form = ref({
  displayName: '',
  email: '',
  password: '',
})

const isPasswordVisible = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const refVForm = ref()

const FIREBASE_AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanımda.',
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
}

const FUNCTIONS_ERROR_MESSAGES = {
  'not-found': 'Davet bulunamadı. Bağlantı geçersiz olabilir.',
  'failed-precondition': 'Bu davet artık geçerli değil.',
  'permission-denied': 'Girdiğiniz e-posta adresi bu davetle eşleşmiyor.',
  'already-exists': 'Bu hesap zaten bir ofise bağlı.',
}

const acceptInvite = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await authStore.acceptInviteAndJoin({
      email: form.value.email,
      password: form.value.password,
      displayName: form.value.displayName,
      tenantId: tenantId.value,
      token: token.value,
    })

    await nextTick(() => {
      router.replace('/')
    })
  }
  catch (err) {
    errorMessage.value = FIREBASE_AUTH_ERROR_MESSAGES[err.code]
      || FUNCTIONS_ERROR_MESSAGES[err.code?.replace('functions/', '')]
      || 'Davet kabul edilemedi. Lütfen tekrar deneyin.'
  }
  finally {
    isSubmitting.value = false
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      acceptInvite()
  })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      cols="12"
      md="6"
      offset-md="3"
      class="auth-card-v2 d-flex align-center justify-center mx-auto"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Ekibe Katılın
          </h4>
          <p class="mb-0">
            Davet edildiğiniz ofise katılmak için hesabınızı oluşturun.
          </p>
        </VCardText>

        <VCardText v-if="!linkIsValid">
          <VAlert
            color="error"
            variant="tonal"
          >
            Davet bağlantısı geçersiz. Ofis yöneticinizden yeni bir davet bağlantısı isteyin.
          </VAlert>
        </VCardText>

        <VCardText v-else>
          <VAlert
            v-if="errorMessage"
            color="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>

          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="form.displayName"
                  :rules="[requiredValidator]"
                  autofocus
                  label="Ad Soyad"
                  placeholder="Ayşe Yılmaz"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="E-posta"
                  type="email"
                  placeholder="Davet edildiğiniz e-posta adresi"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :rules="[requiredValidator]"
                  label="Şifre"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="isSubmitting"
                >
                  Katıl
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
