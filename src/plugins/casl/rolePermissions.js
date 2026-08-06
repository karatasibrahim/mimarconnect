// Maps a tenant role to CASL ability rules for the CRM subjects.
// NOTE: this only gates UI/routes. Tenant isolation and the actual write
// permissions are enforced by Firestore security rules — never treat a
// passing $can() check as proof a Firestore write will succeed.
export const getAbilityRulesForRole = role => {
  switch (role) {
  case 'owner':
  case 'admin':
    return [{ action: 'manage', subject: 'all' }]

  case 'editor':
    return [
      { action: 'read', subject: 'Dashboard' },
      { action: ['read', 'create', 'update'], subject: ['Project', 'Client', 'Quote', 'Transaction', 'Measurement'] },
      { action: 'read', subject: 'Staff' },
      { action: 'read', subject: 'Calculator' },
    ]

  case 'viewer':
    return [
      { action: 'read', subject: 'Dashboard' },
      { action: 'read', subject: ['Project', 'Client', 'Quote', 'Transaction', 'Measurement'] },
      { action: 'read', subject: 'Calculator' },
    ]

  default:
    return []
  }
}
