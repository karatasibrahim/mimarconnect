<script setup>
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import StaffInviteDrawer from '@/views/staff/StaffInviteDrawer.vue'
import { useTenant } from '@/composables/useTenant'
import { db } from '@/firebase/firestore'
import { functions } from '@/firebase/functions'

const { tenantId, tenantCollection, role } = useTenant()

const staff = ref([])
const pendingInvites = ref([])

watch(tenantId, id => {
  if (!id)
    return

  onSnapshot(query(collection(db, 'users'), where('tenantId', '==', id)), snap => {
    staff.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })

  // The invites subcollection is only readable by owner/admin per Firestore
  // rules — skip the subscription entirely for other roles to avoid a
  // permission-denied error.
  if (['owner', 'admin'].includes(role.value)) {
    onSnapshot(query(tenantCollection('invites'), where('status', '==', 'pending')), snap => {
      pendingInvites.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    })
  }
}, { immediate: true })

const ROLE_LABELS = {
  owner: { text: 'Sahip', color: 'primary' },
  admin: { text: 'Yönetici', color: 'info' },
  editor: { text: 'Personel', color: 'success' },
  viewer: { text: 'İzleyici', color: 'secondary' },
}

const roleOptions = [
  { title: 'Yönetici', value: 'admin' },
  { title: 'Personel', value: 'editor' },
  { title: 'İzleyici', value: 'viewer' },
]

const isDrawerOpen = ref(false)
const lastInviteLink = ref('')
const showLinkDialog = ref(false)

const onInvited = ({ link }) => {
  lastInviteLink.value = link
  showLinkDialog.value = true
}

const copyLink = async () => {
  await navigator.clipboard.writeText(lastInviteLink.value)
}

const changeRole = async (member, role) => {
  await httpsCallable(functions, 'setUserRole')({ uid: member.id, role })
}

const removeDialog = ref(false)
const memberToRemove = ref(null)

const confirmRemove = member => {
  memberToRemove.value = member
  removeDialog.value = true
}

const doRemove = async () => {
  if (memberToRemove.value)
    await httpsCallable(functions, 'removeStaffMember')({ uid: memberToRemove.value.id })
  removeDialog.value = false
  memberToRemove.value = null
}

const inviteLinkFor = invite => `${window.location.origin}/accept-invite?tenant=${tenantId.value}&token=${invite.id}`

const copyInviteLink = async invite => {
  await navigator.clipboard.writeText(inviteLinkFor(invite))
}
</script>

<template>
  <div>
    <VCard class="mb-6">
      <VCardText class="d-flex justify-space-between align-center">
        <h5 class="text-h5">
          Ekip Üyeleri
        </h5>
        <VBtn
          v-if="$can('manage', 'Staff')"
          prepend-icon="tabler-plus"
          @click="isDrawerOpen = true"
        >
          Personel Davet Et
        </VBtn>
      </VCardText>

      <VDivider />

      <VTable>
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Rol</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in staff"
            :key="member.id"
          >
            <td>{{ member.displayName }}</td>
            <td>{{ member.email }}</td>
            <td style="inline-size: 180px;">
              <VChip
                v-if="member.role === 'owner'"
                :color="ROLE_LABELS.owner.color"
                size="small"
              >
                {{ ROLE_LABELS.owner.text }}
              </VChip>
              <AppSelect
                v-else-if="$can('manage', 'Staff')"
                :model-value="member.role"
                :items="roleOptions"
                density="compact"
                hide-details
                @update:model-value="val => changeRole(member, val)"
              />
              <VChip
                v-else
                :color="ROLE_LABELS[member.role]?.color"
                size="small"
              >
                {{ ROLE_LABELS[member.role]?.text ?? member.role }}
              </VChip>
            </td>
            <td class="text-end">
              <IconBtn
                v-if="member.role !== 'owner' && $can('manage', 'Staff')"
                @click="confirmRemove(member)"
              >
                <VIcon icon="tabler-user-off" />
              </IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <VCard v-if="$can('manage', 'Staff') && pendingInvites.length">
      <VCardText>
        <h5 class="text-h5 mb-2">
          Bekleyen Davetler
        </h5>
      </VCardText>
      <VTable>
        <thead>
          <tr>
            <th>E-posta</th>
            <th>Rol</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="invite in pendingInvites"
            :key="invite.id"
          >
            <td>{{ invite.email }}</td>
            <td>{{ ROLE_LABELS[invite.role]?.text ?? invite.role }}</td>
            <td class="text-end">
              <VBtn
                size="small"
                variant="tonal"
                prepend-icon="tabler-link"
                @click="copyInviteLink(invite)"
              >
                Bağlantıyı Kopyala
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <StaffInviteDrawer
      v-model:is-drawer-open="isDrawerOpen"
      @invited="onInvited"
    />

    <VDialog
      v-model="showLinkDialog"
      max-width="500"
    >
      <VCard title="Davet Bağlantısı Oluşturuldu">
        <VCardText>
          <p class="mb-3">
            E-posta gönderimi henüz aktif değil — bu bağlantıyı davet ettiğiniz kişiyle manuel olarak paylaşın.
          </p>
          <VTextField
            :model-value="lastInviteLink"
            readonly
            append-inner-icon="tabler-copy"
            @click:append-inner="copyLink"
          />
        </VCardText>
        <VCardText class="d-flex justify-end">
          <VBtn @click="showLinkDialog = false">
            Kapat
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog
      v-model="removeDialog"
      max-width="400"
    >
      <VCard>
        <VCardText>
          <strong>{{ memberToRemove?.displayName }}</strong> kişisinin erişimini kaldırmak istediğinize emin misiniz?
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="removeDialog = false"
          >
            Vazgeç
          </VBtn>
          <VBtn
            color="error"
            @click="doRemove"
          >
            Kaldır
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
