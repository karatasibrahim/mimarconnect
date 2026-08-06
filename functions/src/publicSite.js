import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { db } from './lib/admin.js'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Owner/admin claims a path-slug for their public site
// (mimar-connect.web.app/o/{slug}). Slug uniqueness spans all tenants, so
// this needs a cross-document transaction (slugs/{slug} -> tenants/{tenantId})
// that Firestore rules alone can't express — hence a Cloud Function rather
// than a direct client write.
export const claimTenantSlug = onCall(async request => {
  const { auth: callerAuth, data } = request

  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')

  const tenantId = callerAuth.token.tenantId
  if (!tenantId || !['owner', 'admin'].includes(callerAuth.token.role))
    throw new HttpsError('permission-denied', 'Bu işlem için yetkiniz yok.')

  const slug = (data?.slug || '').trim().toLowerCase()
  if (slug.length < 3 || slug.length > 50 || !SLUG_PATTERN.test(slug))
    throw new HttpsError('invalid-argument', 'Site adresi sadece küçük harf, rakam ve tire içerebilir (3-50 karakter).')

  const tenantRef = db.collection('tenants').doc(tenantId)
  const newSlugRef = db.collection('slugs').doc(slug)

  await db.runTransaction(async tx => {
    const [tenantSnap, newSlugSnap] = await Promise.all([tx.get(tenantRef), tx.get(newSlugRef)])

    if (newSlugSnap.exists && newSlugSnap.data().tenantId !== tenantId)
      throw new HttpsError('already-exists', 'Bu site adresi zaten kullanımda.')

    const previousSlug = tenantSnap.data()?.slug

    tx.set(newSlugRef, { tenantId })
    tx.update(tenantRef, { slug })

    if (previousSlug && previousSlug !== slug)
      tx.delete(db.collection('slugs').doc(previousSlug))
  })

  return { slug }
})
