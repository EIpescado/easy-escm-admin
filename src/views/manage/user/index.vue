<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { FORM_DETAIL_LOAD_DELAY, sleep } from '@/hooks/common/form';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { fetchToggleUserState, fetchUserDetail, fetchUserExport, fetchUserList } from '@/service/api';
import { userStateOptions, userStateRecord } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import UserOperateModal from './modules/user-operate-modal.vue';
import UserResetPasswordModal from './modules/user-reset-password-modal.vue';

defineOptions({
  name: 'ManageUser'
});

const router = useRouter();

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  { prop: 'username', label: $t('page.manage.user.username'), valueType: 'text', types: ['like'] },
  { prop: 'nickname', label: $t('page.manage.user.nickname'), valueType: 'text', types: ['like'] },
  { prop: 'phone', label: $t('page.manage.user.phone'), valueType: 'text', types: ['eq', 'like'] },
  { prop: 'mail', label: $t('page.manage.user.mail'), valueType: 'text' },
  {
    prop: 'registerTime',
    label: $t('page.manage.user.registerTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'state',
    label: $t('page.manage.user.stateLabel'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(userStateOptions)
  }
]);

/**
 * Button state rules, keyed by the backend button `click` code.
 *
 * Return `true` to disable a button. `rows` is the checked rows for a toolbar button, or the row
 * itself for a row button.
 */
const buttonStateRules: PageButtonStateRules<Api.SystemManage.User> = {
  enable: ({ rows }) => !rows.some(row => row.stateEnum !== 'NORMAL'),
  disable: ({ rows }) => !rows.some(row => row.stateEnum === 'NORMAL'),
  update: ({ rows }) => rows.length !== 1,
  resetPassword: ({ rows }) => rows.length !== 1
};

/** Data columns; the operate and the selection columns are added by the list */
const columns = computed<NaiveUI.TableColumn<Api.SystemManage.User>[]>(() => [
  {
    key: 'username',
    title: $t('page.manage.user.username'),
    align: 'center',
    minWidth: 100,
    render: row => h(NButton, { text: true, type: 'primary', onClick: () => handleUserDetail(row.id) }, [row.username])
  },
  { key: 'nickname', title: $t('page.manage.user.nickname'), align: 'center', minWidth: 100 },
  { key: 'phone', title: $t('page.manage.user.phone'), align: 'center', minWidth: 120 },
  { key: 'mail', title: $t('page.manage.user.mail'), align: 'center', minWidth: 160 },
  {
    key: 'state',
    title: $t('page.manage.user.stateLabel'),
    align: 'center',
    width: 100,
    render: row => {
      const type = row.stateEnum === 'NORMAL' ? 'success' : row.stateEnum === 'FORBIDDEN' ? 'error' : 'warning';

      return h(NTag, { type, size: 'small', bordered: false }, { default: () => $t(userStateRecord[row.stateEnum]) });
    }
  },
  { key: 'registerTime', title: $t('page.manage.user.registerTime'), align: 'center', minWidth: 170 },
  { key: 'lastLoginTime', title: $t('page.manage.user.lastLoginTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` so the page reloads the table after a change */
interface ManageListInstance {
  getData: () => Promise<void>;
}

const listRef = ref<ManageListInstance | null>(null);

async function refreshList() {
  await listRef.value?.getData();
}

/** Toolbar buttons (position `top`), text comes from the backend button `name` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleAdd };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.User | null>(null);

/** the operate modal edits a `UserForm` */
const editRow = computed(() => editingData.value as unknown as Api.SystemManage.UserForm | null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = {
    id: undefined,
    username: '',
    nickname: '',
    phone: '',
    mail: '',
    roleIds: []
  } as unknown as Api.SystemManage.User;

  openDrawer();
}

/** increments on every edit to drop the response of a superseded request */
let editDetailToken = 0;

async function handleEditUser(id: string) {
  operateType.value = 'edit';
  // open first so the dialog shows its skeleton, then load the detail
  editingData.value = null;
  openDrawer();

  const token = ++editDetailToken;
  await sleep(FORM_DETAIL_LOAD_DELAY);

  // aborted while waiting (dialog closed or another row selected)
  if (token !== editDetailToken || !drawerVisible.value || operateType.value !== 'edit') return;

  const { data: detail, error } = await fetchUserDetail(id);

  // drop the response if the dialog changed while loading
  if (token !== editDetailToken || !drawerVisible.value || operateType.value !== 'edit') return;

  if (!error) {
    editingData.value = detail as unknown as Api.SystemManage.User;
  }
}

/** navigate to the standalone user detail page */
function handleUserDetail(id: string) {
  router.push({ name: 'manage_user-detail', params: { id } });
}

const { bool: resetPwdVisible, setTrue: openResetPwd } = useBoolean();

/** Target user of the reset-password modal */
const resetPwdUser = ref<{ id: string; username: string }>({ id: '', username: '' });

function handleResetPassword(row: Api.SystemManage.User) {
  resetPwdUser.value = { id: row.id, username: row.username };
  openResetPwd();
}

function handleSetState(row: Api.SystemManage.User, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.user.enableConfirm' : 'page.manage.user.disableConfirm', { name: row.username }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleUserState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Row action handlers, dispatched by the backend button `click` */
const rowActionHandlers: Record<string, (row: Api.SystemManage.User) => void> = {
  update: row => handleEditUser(row.id),
  detail: row => handleUserDetail(row.id),
  resetPassword: handleResetPassword,
  enable: row => handleSetState(row, true),
  disable: row => handleSetState(row, false)
};

function handleRowAction(row: Api.SystemManage.User, key: string) {
  const handler = rowActionHandlers[key];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

async function handleSubmitted() {
  closeDrawer();
  await refreshList();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_user"
      class="min-h-0 flex-1"
      :api="fetchUserList"
      :export-api="fetchUserExport"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonStateRules"
      selection
      sortable
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <UserOperateModal
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row="editRow"
      @submitted="handleSubmitted"
    />
    <UserResetPasswordModal
      v-model:visible="resetPwdVisible"
      :user-id="resetPwdUser.id"
      :username="resetPwdUser.username"
    />
  </div>
</template>
