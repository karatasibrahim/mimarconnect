<script setup>
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/firestore'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const route = useRoute('o-slug')

const isLoading = ref(true)
const notFound = ref(false)
const profile = ref(null)
const projects = ref([])

onMounted(async () => {
  const slugSnap = await getDoc(doc(db, 'slugs', route.params.slug))

  if (!slugSnap.exists()) {
    notFound.value = true
    isLoading.value = false

    return
  }

  const tenantId = slugSnap.data().tenantId

  const profileSnap = await getDoc(doc(db, 'tenants', tenantId, 'public', 'profile'))

  profile.value = profileSnap.exists() ? profileSnap.data() : { name: 'Mimarlık Ofisi' }

  const projectsSnap = await getDocs(query(collection(db, 'tenants', tenantId, 'projects'), where('isPublic', '==', true)))

  projects.value = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  isLoading.value = false
})
</script>

<template>
  <div class="public-site-page">
    <div
      v-if="isLoading"
      class="d-flex justify-center align-center"
      style="block-size: 100vh;"
    >
      <VProgressCircular indeterminate />
    </div>

    <div
      v-else-if="notFound"
      class="d-flex flex-column justify-center align-center text-center"
      style="block-size: 100vh;"
    >
      <h4 class="text-h4 mb-2">
        Site bulunamadı
      </h4>
      <p class="text-body-1">
        Bu adreste yayınlanmış bir ofis sitesi yok.
      </p>
    </div>

    <div
      v-else
      class="mx-auto"
      style="max-inline-size: 960px; padding-block: 64px; padding-inline: 24px;"
    >
      <div class="text-center mb-12">
        <h1 class="text-h2 mb-3">
          {{ profile.name }}
        </h1>
        <p
          v-if="profile.description"
          class="text-body-1"
        >
          {{ profile.description }}
        </p>
        <div class="d-flex justify-center flex-wrap gap-4 mt-4">
          <span
            v-if="profile.phone"
            class="text-body-2"
          >{{ profile.phone }}</span>
          <span
            v-if="profile.email"
            class="text-body-2"
          >{{ profile.email }}</span>
          <a
            v-if="profile.website"
            :href="profile.website"
            target="_blank"
            rel="noopener"
            class="text-body-2"
          >{{ profile.website }}</a>
        </div>
      </div>

      <h4
        v-if="projects.length"
        class="text-h4 mb-6"
      >
        Projeler
      </h4>

      <VRow v-if="projects.length">
        <VCol
          v-for="project in projects"
          :key="project.id"
          cols="12"
          md="6"
        >
          <VCard>
            <VCardText>
              <h5 class="text-h5 mb-2">
                {{ project.title }}
              </h5>
              <p
                v-if="project.description"
                class="text-body-2"
              >
                {{ project.description }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <p
        v-else
        class="text-center text-body-1"
      >
        Henüz herkese açık bir proje eklenmemiş.
      </p>
    </div>
  </div>
</template>
