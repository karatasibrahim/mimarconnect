<script setup>
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '@/firebase/firestore'
import { functions } from '@/firebase/functions'
import { useTenant } from '@/composables/useTenant'

definePage({
  meta: {
    action: 'manage',
    subject: 'TenantSettings',
  },
})

const { tenantId, tenant } = useTenant()

const slugInput = ref('')
const isSavingSlug = ref(false)
const slugError = ref('')
const slugSuccess = ref('')

watch(tenant, t => {
  if (t?.slug && !slugInput.value)
    slugInput.value = t.slug
}, { immediate: true })

const publicUrl = computed(() => tenant.value?.slug
  ? `${window.location.origin}/o/${tenant.value.slug}`
  : null)

const saveSlug = async () => {
  slugError.value = ''
  slugSuccess.value = ''
  isSavingSlug.value = true

  try {
    await httpsCallable(functions, 'claimTenantSlug')({ slug: slugInput.value })
    slugSuccess.value = 'Site adresiniz güncellendi.'
  }
  catch (err) {
    slugError.value = err.code === 'functions/already-exists'
      ? 'Bu site adresi zaten kullanımda.'
      : err.message || 'Site adresi kaydedilemedi.'
  }
  finally {
    isSavingSlug.value = false
  }
}

const profile = ref({
  name: '',
  description: '',
  phone: '',
  email: '',
  website: '',
})

const isSavingProfile = ref(false)
const profileSuccess = ref('')
let profileLoadedFromFirestore = false

watch(tenantId, id => {
  if (!id)
    return

  onSnapshot(doc(db, 'tenants', id, 'public', 'profile'), snap => {
    if (snap.exists()) {
      profile.value = { ...profile.value, ...snap.data() }
      profileLoadedFromFirestore = true
    }
  })
}, { immediate: true })

watch(tenant, t => {
  if (t?.name && !profileLoadedFromFirestore && !profile.value.name)
    profile.value.name = t.name
}, { immediate: true })

const saveProfile = async () => {
  isSavingProfile.value = true
  profileSuccess.value = ''

  try {
    await setDoc(doc(db, 'tenants', tenantId.value, 'public', 'profile'), profile.value, { merge: true })
    profileSuccess.value = 'Herkese açık profil güncellendi.'
  }
  finally {
    isSavingProfile.value = false
  }
}
</script>

<template>
  <div>
    <h4 class="text-h4 mb-6">
      Site Ayarları
    </h4>

    <VCard
      title="Herkese Açık Site Adresi"
      class="mb-6"
    >
      <VCardText>
        <p class="text-body-2 mb-4">
          Projelerinizi "herkese açık" olarak işaretleyip bu adres üzerinden tanıtım sitenizi yayınlayabilirsiniz.
        </p>

        <VAlert
          v-if="slugError"
          color="error"
          variant="tonal"
          class="mb-4"
        >
          {{ slugError }}
        </VAlert>
        <VAlert
          v-if="slugSuccess"
          color="success"
          variant="tonal"
          class="mb-4"
        >
          {{ slugSuccess }}
        </VAlert>

        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="slugInput"
              label="Site Adresi"
              placeholder="ofis-adiniz"
              prefix="/o/"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
            class="d-flex align-end"
          >
            <VBtn
              :loading="isSavingSlug"
              @click="saveSlug"
            >
              Kaydet
            </VBtn>
          </VCol>
        </VRow>

        <p
          v-if="publicUrl"
          class="text-body-2 mt-2"
        >
          Yayındaki adresiniz:
          <a
            :href="publicUrl"
            target="_blank"
            rel="noopener"
          >{{ publicUrl }}</a>
        </p>
      </VCardText>
    </VCard>

    <VCard title="Herkese Açık Profil">
      <VCardText>
        <VAlert
          v-if="profileSuccess"
          color="success"
          variant="tonal"
          class="mb-4"
        >
          {{ profileSuccess }}
        </VAlert>

        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="profile.name"
              label="Ofis Adı (sitede görünecek)"
            />
          </VCol>
          <VCol cols="12">
            <AppTextarea
              v-model="profile.description"
              label="Ofis Hakkında"
              rows="3"
              placeholder="Ofisinizi kısaca tanıtın"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="profile.phone"
              label="Telefon"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="profile.email"
              label="E-posta"
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="profile.website"
              label="Web Sitesi"
            />
          </VCol>
          <VCol cols="12">
            <VBtn
              :loading="isSavingProfile"
              @click="saveProfile"
            >
              Profili Kaydet
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>
