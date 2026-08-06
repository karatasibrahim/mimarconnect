import { addDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { useTenant } from '@/composables/useTenant'

// Generic realtime list + CRUD wrapper over a tenant-scoped Firestore
// subcollection (tenants/{tenantId}/{collectionName}). Projects, Clients,
// Quotes and Staff all need near-identical CRUD, so this avoids 4x
// copy-pasted Firestore boilerplate.
export const useFirestoreCrud = collectionName => {
  const { tenantCollection, tenantDoc, tenantId } = useTenant()

  const items = ref([])
  const isLoading = ref(true)
  let unsubscribe = null

  const subscribe = () => {
    unsubscribe?.()

    isLoading.value = true
    unsubscribe = onSnapshot(
      query(tenantCollection(collectionName), orderBy('createdAt', 'desc')),
      snapshot => {
        items.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        isLoading.value = false
      },
    )
  }

  watch(tenantId, id => {
    if (id)
      subscribe()
  }, { immediate: true })

  onScopeDispose(() => unsubscribe?.())

  const add = async payload => {
    const authStore = useAuthStore()

    await addDoc(tenantCollection(collectionName), {
      ...payload,
      createdBy: authStore.user?.uid ?? null,
      createdAt: serverTimestamp(),
    })
  }

  const update = async (id, payload) => {
    await updateDoc(tenantDoc(collectionName, id), payload)
  }

  const remove = async id => {
    await deleteDoc(tenantDoc(collectionName, id))
  }

  return { items, isLoading, add, update, remove }
}
