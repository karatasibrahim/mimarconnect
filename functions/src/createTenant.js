import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { auth, db, mergeCustomClaims } from './lib/admin.js'

// Called by the client right after createUserWithEmailAndPassword during
// owner signup. An onCall function (not an Auth onCreate trigger) so the
// client can await a synchronous confirmation before navigating — an async
// trigger could race the router guard and let the user through before
// tenantId/claims exist.
export const createTenantOnSignup = onCall(async request => {
  const { auth: callerAuth, data } = request

  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')

  const uid = callerAuth.uid
  const tenantName = (data?.tenantName || '').trim()

  if (!tenantName)
    throw new HttpsError('invalid-argument', 'Ofis adı zorunludur.')

  const userRef = db.collection('users').doc(uid)
  const tenantRef = db.collection('tenants').doc()
  const userRecord = await auth.getUser(uid)

  const result = await db.runTransaction(async tx => {
    const existing = await tx.get(userRef)
    if (existing.exists) {
      const { tenantId, role } = existing.data()
      return { tenantId, role, alreadyExists: true }
    }

    tx.set(tenantRef, {
      name: tenantName,
      slug: null,
      ownerUid: uid,
      plan: 'trial',
      subscriptionStatus: 'active',
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.set(userRef, {
      tenantId: tenantRef.id,
      role: 'owner',
      displayName: userRecord.displayName || tenantName,
      email: userRecord.email,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    })

    return { tenantId: tenantRef.id, role: 'owner', alreadyExists: false }
  })

  if (!result.alreadyExists)
    await mergeCustomClaims(uid, { tenantId: result.tenantId, role: result.role })

  return { tenantId: result.tenantId, role: result.role }
})
