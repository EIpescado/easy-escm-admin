<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions, userStateOptions, userStateRecord } from '@/constants/business';
import { fetchBindUserAllDict, fetchRemoveUserAllDict, fetchRemoveUserDict, fetchUserDictDetail } from '@/service/api';
import { translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import UserDictAddModal from './modules/user-dict-add-modal.vue';

defineOptions({
  name: 'ManageUserDict'
});

const searchFields = computed<QueryField[]>(() => [
  // the three identifying fields are merged into one keyword condition, OR-ed by the backend (`fast`)
  { prop: 'username', label: $t('page.manage.user.username'), fast: true },
  { prop: 'nickname', label: $t('page.manage.user.nickname'), fast: true },
  { prop: 'phone', label: $t('page.manage.user.phone'), fast: true },
  {
    prop: 'state',
    label: $t('page.manage.user.stateLabel'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(userStateOptions)
  }
]);

/** buttons of the current route, provided by the backend menu tree */

/** Data columns of the user list; the operate and selection columns are added by the list */
const columns = computed<NaiveUI.TableColumn<Api.SystemManage.User>[]>(() => [
  { key: 'username', title: $t('page.manage.user.username'), minWidth: 140 },
  { key: 'nickname', title: $t('page.manage.user.nickname'), minWidth: 140 },
  { key: 'phone', title: $t('page.manage.user.phone'), minWidth: 140 },
  {
    key: 'state',
    title: $t('page.manage.user.stateLabel'),
    align: 'center',
    width: 100,
    render: (row: Api.SystemManage.User) =>
      h(
        NTag,
        { type: row.stateEnum === 'NORMAL' ? 'success' : 'error', size: 'small', bordered: false },
        { default: () => $t(userStateRecord[row.stateEnum]) }
      )
  }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the loaded rows to the page */
interface ManageListInstance<Row> {
  getData: () => Promise<void>;
  reload: () => Promise<void>;
  data: Row[];
}

const listRef = ref<ManageListInstance<Api.SystemManage.User> | null>(null);

/** rows currently loaded in the user list */
const rows = computed(() => listRef.value?.data ?? []);

/** selected user (left), drives the dictionaries panel */
const activeUserId = ref('');
const activeUserName = ref('');

/** whether the selected user owns all dictionaries, it comes from the detail request */
const allDict = ref(false);
/** ids checked in the panel, the actions work on this selection */
const checkedDictIds = ref<(string | number)[]>([]);

/** whether the selected user's dictionaries are being loaded; the panel buttons wait for it */
const panelLoading = ref(false);

/** whether the "add dictionaries" dialog is open */
const { bool: addModalVisible, setTrue: openAddModal, setFalse: closeAddModal } = useBoolean();

/** Search fields of the panel, the same as the dictionary page */
const dictSearchFields = computed<QueryField[]>(() => [
  { prop: 'code', label: $t('page.manage.dict.code'), fast: true },
  { prop: 'name', label: $t('page.manage.dict.name'), fast: true },
  {
    prop: 'state',
    label: $t('page.manage.dict.stateLabel'),
    valueType: 'select',
    types: ['eq', 'ne'],
    options: translateOptions(enableStateOptions)
  }
]);

/** Data columns of the panel */
const dictColumns = computed<NaiveUI.TableColumn<Api.SystemManage.Dict>[]>(() => [
  { key: 'code', title: $t('page.manage.dict.code'), minWidth: 120, ellipsis: { tooltip: true } },
  { key: 'name', title: $t('page.manage.dict.name'), minWidth: 120, ellipsis: { tooltip: true } },
  { key: 'remark', title: $t('page.manage.dict.remark'), minWidth: 120, ellipsis: { tooltip: true } }
]);

/** the list takes the columns as a factory, they follow the locale */
function getDictColumns() {
  return dictColumns.value;
}

const panelListRef = ref<ManageListInstance<Api.SystemManage.Dict> | null>(null);

/** the panel title, it follows the selected user */
const panelTitle = computed(() =>
  activeUserId.value
    ? `${$t('page.manage.dict.ownedDict')} · ${activeUserName.value}`
    : $t('page.manage.dict.ownedDict')
);

/** the panel search is scoped to the selected user, the Qo takes the `userId` directly */
const panelParams = () => (activeUserId.value ? { userId: activeUserId.value } : {});

/** the user whose dictionaries are requested next; only the latest click is kept */
let pendingUserId: string | null = null;
/** whether a dictionary request is running */
let dictRunning = false;
/** the user the panel list currently shows, empty until it mounted for the first time */
let panelUserId = '';

/** load the state of the given user and reload the user scoped dictionary list */
async function loadUserDicts(userId: string) {
  panelLoading.value = true;

  try {
    const { data: detail } = await fetchUserDictDetail(userId);

    // ignore stale responses when the selection changed while loading
    if (activeUserId.value !== userId) return;

    allDict.value = Boolean(detail?.allDict);
    // the list is scoped to the user, so nothing is checked until the operator picks rows
    checkedDictIds.value = [];
  } finally {
    // only release the buttons for the user that is still selected
    if (activeUserId.value === userId) panelLoading.value = false;
  }

  // the panel stays mounted across selections, so it must be asked to search for the new user; on
  // the very first selection the list itself mounts and fetches, hence the guard
  if (panelUserId) await panelListRef.value?.reload();

  panelUserId = userId;
}

/**
 * Request the dictionaries of the given user
 *
 * Only the latest selection is requested: while a request runs, clicking another user just replaces
 * the pending one, so the selections in between never hit the backend.
 */
async function requestUserDicts(userId: string) {
  pendingUserId = userId;

  // a request is running: it picks the pending selection up as soon as it finishes
  if (dictRunning) return;

  dictRunning = true;

  try {
    while (pendingUserId) {
      const next = pendingUserId;
      pendingUserId = null;

      await loadUserDicts(next);
    }
  } finally {
    dictRunning = false;
  }
}

/** clear the panel so the previous user's dictionaries are never shown under the newly selected one */
function clearUserDicts() {
  checkedDictIds.value = [];
  allDict.value = false;
}

async function selectUser(row: Api.SystemManage.User) {
  activeUserId.value = row.id;
  activeUserName.value = row.username;

  // the buttons stay disabled until this user's state has been loaded
  panelLoading.value = true;

  // drop the previous user's dictionaries right away, they belong to another user
  clearUserDicts();

  await requestUserDicts(row.id);
}

function rowClassName(row: Api.SystemManage.User) {
  return row.id === activeUserId.value ? 'user-dict-row--active' : '';
}

function rowProps(row: Api.SystemManage.User) {
  return {
    style: 'cursor: pointer',
    onClick: () => selectUser(row)
  };
}

/** clear the selection when the selected user is no longer in the list */
watch(rows, loaded => {
  if (!loaded.some(row => row.id === activeUserId.value)) {
    activeUserId.value = '';
    activeUserName.value = '';
    clearUserDicts();
  }
});

/** reload the panel of the selected user after a binding change */
async function reloadUserDicts() {
  if (activeUserId.value) await requestUserDicts(activeUserId.value);
}

/** warn and bail out when no user is selected */
function requireActiveUser() {
  if (activeUserId.value) return true;

  window.$message?.warning($t('page.manage.dict.selectUser'));

  return false;
}

/** add dictionaries to the selected user through the search dialog */
function handleAddUserDict() {
  if (!requireActiveUser()) return;

  openAddModal();
}

/** remove the dictionaries checked in the panel from the selected user */
async function handleRemoveUserDict() {
  if (!requireActiveUser()) return;

  if (!checkedDictIds.value.length) {
    window.$message?.warning($t('page.manage.dict.checkDict'));

    return;
  }

  const { error } = await fetchRemoveUserDict({
    userId: activeUserId.value,
    dictIds: checkedDictIds.value as string[]
  });

  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    await reloadUserDicts();
  }
}

/** grant every dictionary to the selected user */
async function handleBindUserAllDict() {
  if (!requireActiveUser()) return;

  const { error } = await fetchBindUserAllDict({ userId: activeUserId.value });

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    await reloadUserDicts();
  }
}

/** revoke the all-dictionaries grant of the selected user */
async function handleRemoveUserAllDict() {
  if (!requireActiveUser()) return;

  const { error } = await fetchRemoveUserAllDict({ userId: activeUserId.value });

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    await reloadUserDicts();
  }
}

/** close the add dialog and refresh the panel */
async function handleDictAdded() {
  closeAddModal();

  await reloadUserDicts();
}

/**
 * Button state rules of the dictionaries panel
 *
 * - every action waits for the selected user's state to be loaded
 * - when the user already owns every dictionary, only revoking that grant makes sense
 * - removing dictionaries needs a row selection
 */
const dictButtonRules: PageButtonStateRules<Api.SystemManage.Dict> = {
  addUserDict: () => panelLoading.value || allDict.value,
  bindUserAllDict: () => panelLoading.value || allDict.value,
  removeUserDict: () => panelLoading.value || allDict.value || !checkedDictIds.value.length,
  removeUserAllDict: () => panelLoading.value || !allDict.value
};

/** Panel toolbar buttons, dispatched by the backend button `click` */
const dictActionHandlers: Record<string, () => void> = {
  addUserDict: handleAddUserDict,
  removeUserDict: handleRemoveUserDict,
  bindUserAllDict: handleBindUserAllDict,
  removeUserAllDict: handleRemoveUserAllDict
};

function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handler = dictActionHandlers[button.click ?? ''];

  if (handler) handler();
  else window.$message?.info($t('common.lookForward'));
}
</script>

<template>
  <div class="min-h-0 flex flex-1 gap-16px overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_user_dict"
      class="min-w-0 min-h-0 flex-[5]"
      url="/system/user/search"
      :fields="searchFields"
      :columns="getColumns"
      :row-class-name="rowClassName"
      :row-props="rowProps"
    />
    <div class="min-w-0 min-h-0 flex flex-[5] flex-col gap-8px">
      <!-- display only: the flag comes from the loaded detail, it is never toggled by hand -->
      <NCheckbox v-if="activeUserId" :checked="allDict" disabled class="shrink-0">
        {{ $t('page.manage.dict.allDict') }}
      </NCheckbox>
      <ManageList
        v-if="activeUserId"
        ref="panelListRef"
        v-model:checked-row-keys="checkedDictIds"
        table-key="manage_user_dict_panel"
        :title="panelTitle"
        class="min-h-0 flex-1"
        url="/system/dict/userDictSearch"
        :extra-params="panelParams"
        :fields="dictSearchFields"
        :columns="getDictColumns"
        top-button-position="left-top"
        :button-rules="dictButtonRules"
        selection
        @toolbar-action="handleToolbarAction"
      />
      <NEmpty v-else class="mt-80px" :description="$t('page.manage.dict.selectUser')" />
    </div>
    <UserDictAddModal v-model:visible="addModalVisible" :user-id="activeUserId" @submitted="handleDictAdded" />
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* the selected user row */
:deep(.user-dict-row--active .n-data-table-td) {
  background-color: var(--n-td-color-hover, rgba(0, 0, 0, 0.04));
}

.card-wrapper :deep(.n-card-content) {
  min-height: 0;
}
</style>
