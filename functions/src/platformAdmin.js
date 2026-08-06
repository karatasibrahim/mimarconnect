import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { mergeCustomClaims } from './lib/admin.js'

// One-off bootstrap for the platform operator's own account. There is no
// self-serve way to become a platform admin (that would be a privilege
// escalation hole) — this only ever grants the flag to the hardcoded
// operator email below. Run once from the browser console after signing in
// with that account, then this function becomes dead code for that account
// (it's idempotent, so re-running it is harmless).
const PLATFORM_ADMIN_EMAILS = ['ibrahimmkaratas@gmail.com']

export const bootstrapPlatformAdmin = onCall(async request => {
  const { auth: callerAuth } = request

  if (!callerAuth)
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmış olmanız gerekir.')

  const email = (callerAuth.token.email || '').toLowerCase()
  if (!PLATFORM_ADMIN_EMAILS.includes(email))
    throw new HttpsError('permission-denied', 'Bu hesap platform yöneticisi olamaz.')

  await mergeCustomClaims(callerAuth.uid, { platformAdmin: true })

  return { platformAdmin: true }
})
