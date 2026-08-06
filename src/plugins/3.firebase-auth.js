import { useAuthStore } from '@/stores/auth'

// Sorted after 2.pinia.js by registerPlugins' alphabetical glob order, so
// Pinia is guaranteed installed before this runs.
export default function () {
  useAuthStore().init()
}
