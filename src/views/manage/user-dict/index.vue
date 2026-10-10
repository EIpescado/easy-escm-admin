<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { getTableScrollX } from '@/hooks/common/table';
import { usePageButtonState, usePageButtons, type PageButtonStateRules } from '@/hooks/business/page-buttons';
import {
  fetchBindUserAllDict,
  fetchRemoveUserAllDict,
  fetchRemoveUserDict,
  fetchUserDictDetail,
  fetchUserList
} from '@/service/api';
import { userStateOptions, userStateRecord } from '@/constants/business';
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
const { leftTopButtons } = usePageButtons();

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
interface ManageListInstance {
  getData: () => Promise<void>;
  data: Api.SystemManage.User[];
}

const listRef = ref<ManageListInstance | null>(null);

/** rows currently loaded in the user list */
const rows = computed(() => listRef.value?.data ?? []);

/** selected user (left), drives the dictionaries panel */
const activeUserId = ref('');
const activeUserName = ref('');

/** dictionaries owned by the selected user, returned by the detail request */
const ownedDicts = ref<Api.SystemManage.Dict[]>([]);
/** whether the selected user owns all dictionaries */
const allDict = ref(false);
/** the rows checked in the panel; the actions work on this selection, not on the owned set */
const checkedDictIds = ref<(string | number)[]>([]);
const dictLoading = ref(false);

/** whether the "add dictionaries" dialog is open */
const { bool: addModalVisible, setTrue: openAddModal, setFalse: closeAddModal } = useBoolean();

/** dictionary columns: a selection column plus the dictionary fields */
const dictColumns = computed<NaiveUI.TableColumn<Api.SystemManage.Dict>[]>(() => [
  { type: 'selection', disabled: () => allDict.value },
  { key: 'code', title: $t('page.manage.dict.code'), minWidth: 120, ellipsis: { tooltip: true } },
  { key: 'name', title: $t('page.manage.dict.name'), minWidth: 120, ellipsis: { tooltip: true } },
  { key: 'remark', title: $t('page.manage.dict.remark'), minWidth: 120, ellipsis: { tooltip: true } }
]);

/** total width of the dictionary columns, drives the horizontal scrollbar of the right table */
const dictScrollX = computed(() => getTableScrollX(dictColumns.value));

/** the user whose dictionaries are requested next; only the latest click is kept */
let pendingUserId: string | null = null;
/** whether a dictionary request is running */
let dictRunning = false;

/** load the dictionaries of the given user into the right panel */
async function loadUserDicts(userId: string) {
  dictLoading.value = true;

  // the detail already carries the dictionaries owned by the user, so no whole-list request is needed
  const { data: detail, error } = await fetchUserDictDetail(userId);

  // ignore stale responses when the selection changed while loading
  if (activeUserId.value !== userId) return;

  dictLoading.value = false;

  allDict.value = Boolean(detail?.allDict);
  ownedDicts.value = error ? [] : (detail?.dictList ?? []);
  // the checkboxes pick what an action works on, so they start empty
  checkedDictIds.value = [];
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
  ownedDicts.value = [];
  checkedDictIds.value = [];
  allDict.value = false;
}

async function selectUser(row: Api.SystemManage.User) {
  activeUserId.value = row.id;
  activeUserName.value = row.username;

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
 * - when the user already owns every dictionary, only revoking that grant makes sense
 * - removing dictionaries needs a row selection
 */
const dictButtonRules: PageButtonStateRules<Api.SystemManage.Dict> = {
  addUserDict: () => allDict.value,
  bindUserAllDict: () => allDict.value,
  removeUserDict: () => allDict.value || !checkedDictIds.value.length,
  removeUserAllDict: () => !allDict.value
};

const { isDisabled: isDictButtonDisabled } = usePageButtonState(dictButtonRules);

/** whether a panel button is disabled by the rules above */
function isPanelButtonDisabled(button: Api.SystemManage.ButtonNode) {
  return isDictButtonDisabled(button.click, [], 'left-top');
}

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
      :api="fetchUserList"
      :fields="searchFields"
      :columns="getColumns"
      :row-class-name="rowClassName"
      :row-props="rowProps"
    />
    <NCard :bordered="false" size="small" class="min-w-0 min-h-0 flex-[5] card-wrapper">
      <template #header>
        <div class="min-w-0 flex items-center justify-between gap-8px">
          <span class="truncate">
            {{
              activeUserId
                ? `${$t('page.manage.dict.ownedDict')} · ${activeUserName}`
                : $t('page.manage.dict.ownedDict')
            }}
          </span>
          <TableToolbarButtons
            :buttons="leftTopButtons"
            :disabled="isPanelButtonDisabled"
            @select="handleToolbarAction"
          />
        </div>
      </template>
      <div v-if="activeUserId" class="h-full min-h-0 flex flex-col gap-8px">
        <!-- display only: the flag comes from the loaded detail, it is never toggled by hand -->
        <NCheckbox :checked="allDict" disabled class="shrink-0">{{ $t('page.manage.dict.allDict') }}</NCheckbox>
        <NDataTable
          v-model:checked-row-keys="checkedDictIds"
          :columns="dictColumns"
          :data="ownedDicts"
          :loading="dictLoading"
          :row-key="row => row.id"
          :paginate-single-page="true"
          :scroll-x="dictScrollX"
          size="small"
          flex-height
          class="min-h-0 flex-1"
        />
      </div>
      <NEmpty v-else class="mt-80px" :description="$t('page.manage.dict.selectUser')" />
    </NCard>
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
