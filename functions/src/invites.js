import { randomUUID } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { auth, db, mergeCustomClaims } from './lib/admin.js'

const INVITABLE_ROLES = ['admin', 'editor', 'viewer']

// Owner/admin invites a new staff member by email. Phase 1 has no email
// delivery wired up: the returned { tenantId, token } is used by the caller
// to build an /accept-invite link that gets shared manually.
export const inviteStaffMember = onCall(async request => {
  const { auth: callerAuth, data } = request

  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')

  const tenantId = callerAuth.token.tenantId
  const callerRole = callerAuth.token.role
  if (!tenantId || !['owner', 'admin'].includes(callerRole))
    throw new HttpsError('permission-denied', 'Personel davet etme yetkiniz yok.')

  const email = (data?.email || '').trim().toLowerCase()
  const role = data?.role

  if (!email)
    throw new HttpsError('invalid-argument', 'E-posta adresi zorunludur.')
  if (!INVITABLE_ROLES.includes(role))
    throw new HttpsError('invalid-argument', 'Geçersiz rol.')

  // Phase 1 simplification: one email can only belong to one tenant.
  try {
    const existingAuthUser = await auth.getUserByEmail(email)
    const existingUserDoc = await db.collection('users').doc(existingAuthUser.uid).get()
    if (existingUserDoc.exists)
      throw new HttpsError('already-exists', 'Bu e-posta adresi zaten bir ofise kayıtlı.')
  }
  catch (err) {
    if (err instanceof HttpsError)
      throw err
    // auth/user-not-found is the expected path: email isn't registered yet.
    if (err.code !== 'auth/user-not-found')
      throw err
  }

  const token = randomUUID()

  await db.collection('tenants').doc(tenantId).collection('invites').doc(token).set({
    email,
    role,
    invitedBy: callerAuth.uid,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  })

  return { tenantId, token }
})

// Invitee, after creating their own Firebase Auth account, calls this with
// the { tenantId, token } pair carried in the /accept-invite link's query
// string to join the inviting tenant.
export const acceptInvite = onCall(async request => {
  const { auth: callerAuth, data } = request

  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')

  const tenantId = data?.tenantId
  const token = data?.token
  if (!tenantId || !token)
    throw new HttpsError('invalid-argument', 'Davet bağlantısı geçersiz.')

  const inviteRef = db.collection('tenants').doc(tenantId).collection('invites').doc(token)
  const inviteSnap = await inviteRef.get()
  if (!inviteSnap.exists)
    throw new HttpsError('not-found', 'Davet bulunamadı.')

  const invite = inviteSnap.data()
  if (invite.status !== 'pending')
    throw new HttpsError('failed-precondition', 'Bu davet artık geçerli değil.')

  const userRecord = await auth.getUser(callerAuth.uid)
  if ((userRecord.email || '').toLowerCase() !== invite.email)
    throw new HttpsError('permission-denied', 'Bu davet başka bir e-posta adresi için oluşturulmuş.')

  const userRef = db.collection('users').doc(callerAuth.uid)
  const existingUser = await userRef.get()
  if (existingUser.exists)
    throw new HttpsError('already-exists', 'Bu hesap zaten bir ofise bağlı.')

  await db.runTransaction(async tx => {
    tx.set(userRef, {
      tenantId,
      role: invite.role,
      displayName: userRecord.displayName || invite.email,
      email: invite.email,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    })
    tx.update(inviteRef, {
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: callerAuth.uid,
    })
  })

  await mergeCustomClaims(callerAuth.uid, { tenantId, role: invite.role })

  return { tenantId, role: invite.role }
})
