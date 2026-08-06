import { createMongoAbility } from '@casl/ability'

// Starts with no rules — the real rules are loaded once Firebase Auth
// resolves the signed-in user's role (see src/stores/auth.js's ability.update() call).
export const ability = createMongoAbility([])
