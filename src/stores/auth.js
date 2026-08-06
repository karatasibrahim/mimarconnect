import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { defineStore } from 'pinia'
import { auth } from '@/firebase/auth'
import { db } from '@/firebase/firestore'
import { functions } from '@/firebase/functions'
import { ability } from '@/plugins/casl/ability'
import { getAbilityRulesForRole } from '@/plugins/casl/rolePermissions'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userDoc = ref(null)
  const tenant = ref(null)
  const isReady = ref(false)
  const isPlatformAdmin = ref(false)

  let resolveReady
  const readyPromise = new Promise(resolve => {
    resolveReady = resolve
  })

  const waitUntilReady = () => readyPromise

  // Refreshes userDoc/tenant/CASL ability from Firestore + the current ID
  // token's claims. Called on every auth-state change, and manually right
  // after any flow that changes role/tenantId (signup, invite accept) since
  // those need an explicit token refresh to take effect (see registerOwner).
  const loadUserContext = async firebaseUser => {
    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid))

    userDoc.value = userSnap.exists() ? userSnap.data() : null

    if (userDoc.value?.tenantId) {
      const tenantSnap = await getDoc(doc(db, 'tenants', userDoc.value.tenantId))

      tenant.value = tenantSnap.exists() ? tenantSnap.data() : null
    }
    else {
      tenant.value = null
    }

    const idTokenResult = await firebaseUser.getIdTokenResult()

    isPlatformAdmin.value = idTokenResult.claims.platformAdmin === true

    const rules = getAbilityRulesForRole(userDoc.value?.role)
    if (isPlatformAdmin.value)
      rules.push({ action: 'manage', subject: 'PlatformAdmin' })

    ability.update(rules)
  }

  const init = () => {
    onAuthStateChanged(auth, async firebaseUser => {
      user.value = firebaseUser

      if (firebaseUser)
        await loadUserContext(firebaseUser)
      else {
        userDoc.value = null
        tenant.value = null
        isPlatformAdmin.value = false
        ability.update([])
      }

      if (!isReady.value) {
        isReady.value = true
        resolveReady()
      }
    })
  }

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  // Owner signup: creates the Firebase Auth user, then awaits the
  // createTenantOnSignup callable (not an Auth onCreate trigger — the client
  // needs a synchronous confirmation before navigating past the router guard).
  const registerOwner = async ({ email, password, tenantName }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)

    await httpsCallable(functions, 'createTenantOnSignup')({ tenantName })

    // custom claims only land in the ID token after a forced refresh
    await credential.user.getIdToken(true)
    await loadUserContext(credential.user)
  }

  // Invited staff member: creates their own Firebase Auth account, then
  // redeems the invite (tenantId/token from the /accept-invite link) via the
  // acceptInvite callable, which validates the email matches the invite and
  // sets the tenant/role custom claims.
  const acceptInviteAndJoin = async ({ email, password, displayName, tenantId, token }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName)
      await updateProfile(credential.user, { displayName })

    await httpsCallable(functions, 'acceptInvite')({ tenantId, token })

    await credential.user.getIdToken(true)
    await loadUserContext(credential.user)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const refreshClaims = async () => {
    if (!user.value)
      return

    await user.value.getIdToken(true)
    await loadUserContext(user.value)
  }

  return {
    user,
    userDoc,
    tenant,
    isReady,
    isPlatformAdmin,
    waitUntilReady,
    init,
    login,
    registerOwner,
    acceptInviteAndJoin,
    logout,
    refreshClaims,
  }
})
