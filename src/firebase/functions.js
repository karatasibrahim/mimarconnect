import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { firebaseApp, useFirebaseEmulators } from './app'

export const functions = getFunctions(firebaseApp)

if (useFirebaseEmulators)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
