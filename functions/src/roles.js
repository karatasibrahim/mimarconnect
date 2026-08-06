import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { auth, db, mergeCustomClaims } from './lib/admin.js'

const ASSIGNABLE_ROLES = ['admin', 'editor', 'viewer']

function requireOwnerOrAdmin(callerAuth) {
  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')
  if (!['owner', 'admin'].includes(callerAuth.token.role))
    throw new HttpsError('permission-denied', 'Bu işlem için yetkiniz yok.')

  return callerAuth.token.tenantId
}

export const setUserRole = onCall(async request => {
  const { auth: callerAuth, data } = request
  const tenantId = requireOwnerOrAdmin(callerAuth)

  const targetUid = data?.uid
  const role = data?.role
  if (!targetUid || !ASSIGNABLE_ROLES.includes(role))
    throw new HttpsError('invalid-argument', 'Geçersiz kullanıcı veya rol.')

  const targetRef = db.collection('users').doc(targetUid)
  const targetSnap = await targetRef.get()
  if (!targetSnap.exists || targetSnap.data().tenantId !== tenantId)
    throw new HttpsError('not-found', 'Kullanıcı bu ofiste bulunamadı.')
  if (targetSnap.data().role === 'owner')
    throw new HttpsError('permission-denied', 'Ofis sahibinin rolü değiştirilemez.')

  await targetRef.update({ role })
  await mergeCustomClaims(targetUid, { tenantId, role })

  return { uid: targetUid, role }
})

export const removeStaffMember = onCall(async request => {
  const { auth: callerAuth, data } = request
  const tenantId = requireOwnerOrAdmin(callerAuth)

  const targetUid = data?.uid
  if (!targetUid)
    throw new HttpsError('invalid-argument', 'Kullanıcı belirtilmedi.')

  const targetRef = db.collection('users').doc(targetUid)
  const targetSnap = await targetRef.get()
  if (!targetSnap.exists || targetSnap.data().tenantId !== tenantId)
    throw new HttpsError('not-found', 'Kullanıcı bu ofiste bulunamadı.')
  if (targetSnap.data().role === 'owner')
    throw new HttpsError('permission-denied', 'Ofis sahibi kaldırılamaz.')

  await targetRef.update({ status: 'disabled' })
  await auth.updateUser(targetUid, { disabled: true })
  await mergeCustomClaims(targetUid, { tenantId, role: 'disabled' })

  return { uid: targetUid, status: 'disabled' }
})
