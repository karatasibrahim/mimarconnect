import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// No credential argument: Cloud Functions' runtime (and the emulator) supply
// Application Default Credentials automatically — never check in a service
// account key file for this.
export const app = initializeApp()
export const auth = getAuth(app)
export const db = getFirestore(app)

// Custom claims are fully replaced (not merged) by setCustomUserClaims, so
// any call that sets tenantId/role must preserve unrelated claims like
// platformAdmin — otherwise a platform admin who also owns a tenant would
// lose that flag the next time their tenant role changes.
export async function mergeCustomClaims(uid, updates) {
  const userRecord = await auth.getUser(uid)

  await auth.setCustomUserClaims(uid, { ...(userRecord.customClaims || {}), ...updates })
}
