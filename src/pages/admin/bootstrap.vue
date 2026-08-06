<script setup>
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/functions'
import { useAuthStore } from '@/stores/auth'

definePage({
  meta: {
    action: 'read',
    subject: 'Dashboard',
  },
})

const authStore = useAuthStore()
const router = useRouter()

const isSubmitting = ref(false)
const errorMessage = ref('')

const claim = async () => {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await httpsCallable(functions, 'bootstrapPlatformAdmin')()
    await authStore.refreshClaims()
    router.replace({ name: 'admin-tenants' })
  }
  catch (err) {
    errorMessage.value = err.code === 'functions/permission-denied'
      ? 'Bu hesap platform yöneticisi olamaz.'
      : 'İşlem başarısız oldu.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <VCard
      title="Platform Yöneticiliği"
      max-width="480"
    >
      <VCardText>
        <p class="mb-4">
          Bu, platform operatörünün hesabına tek seferlik yönetici yetkisi tanımlamak için kullanılır.
          Sadece önceden tanımlı operatör e-postası için çalışır.
        </p>
        <VAlert
          v-if="errorMessage"
          color="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorMessage }}
        </VAlert>
        <VBtn
          :loading="isSubmitting"
          @click="claim"
        >
          Platform Yöneticisi Yetkisi Al
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>
