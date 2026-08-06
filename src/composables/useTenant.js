import { collection, doc } from 'firebase/firestore'
import { storeToRefs } from 'pinia'
import { db } from '@/firebase/firestore'
import { useAuthStore } from '@/stores/auth'

// Scopes Firestore access to the signed-in user's tenant (tenants/{tenantId}/...).
export const useTenant = () => {
  const { userDoc, tenant } = storeToRefs(useAuthStore())

  const tenantId = computed(() => userDoc.value?.tenantId ?? null)
  const role = computed(() => userDoc.value?.role ?? null)

  const tenantCollection = name => {
    if (!tenantId.value)
      throw new Error('Tenant henüz yüklenmedi.')

    return collection(db, 'tenants', tenantId.value, name)
  }

  const tenantDoc = (name, id) => {
    if (!tenantId.value)
      throw new Error('Tenant henüz yüklenmedi.')

    return doc(db, 'tenants', tenantId.value, name, id)
  }

  return { tenantId, role, tenant, tenantCollection, tenantDoc }
}
