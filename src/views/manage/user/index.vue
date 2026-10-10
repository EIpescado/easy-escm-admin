<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useTableOperate } from '@/hooks/common/table';
import { useManageTable } from '@/hooks/business/manage-table';
import { FORM_DETAIL_LOAD_DELAY, sleep } from '@/hooks/common/form';
import {
  getButtonLabel,
  usePageButtonState,
  usePageButtons,
  type PageButtonStateRules
} from '@/hooks/business/page-buttons';
import { fetchToggleUserState, fetchUserDetail, fetchUserExport, fetchUserList } from '@/service/api';
import { userStateOptions, userStateRecord } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import TableExportButton from '@/components/advanced/table-export-button.vue';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import UserOperateModal from './modules/user-operate-modal.vue';
import UserResetPasswordModal from './modules/user-reset-password-modal.vue';

defineOptions({
  name: 'ManageUser'
});

const router = useRouter();

const searchFields = computed<QueryField[]>(() => [
  { prop: 'username', label: $t('page.manage.user.username'), valueType: 'text', defaultType: 'like', types: ['like'] },
  { prop: 'nickname', label: $t('page.manage.user.nickname'), valueType: 'text', defaultType: 'like', types: ['like'] },
  { prop: 'phone', label: $t('page.manage.user.phone'), valueType: 'text', defaultType: 'eq', types: ['eq', 'like'] },
  { prop: 'mail', label: $t('page.manage.user.mail'), valueType: 'text', defaultType: 'like' },
  {
    prop: 'registerTime',
    label: $t('page.manage.user.registerTime'),
    valueType: 'date',
    defaultType: 'between',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'state',
    label: $t('page.manage.user.stateLabel'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq'],
    options: translateOptions(userStateOptions)
  }
]);

/** Buttons of the current route, provided by the backend menu tree */
const { toolbarButtons, rowButtons } = usePageButtons();

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

const { isDisabled: isButtonDisabled } = usePageButtonState(buttonStateRules);

/** Row action buttons (position `row`), text comes from the backend button `name` */
function getOperateOptions(row: Api.SystemManage.User) {
  return rowButtons.value.map(button => ({
    key: button.click ?? button.name,
    label: getButtonLabel(button),
    danger: button.click === 'disable',
    disabled: isButtonDisabled(button.click, [row], 'row'),
    icon: button.icon || undefined
  }));
}

const operateColumnWidth = computed(() =>
  getTableOperateColumnWidth(rowButtons.value.map(button => getButtonLabel(button)))
);

const {
  conditions: searchConditions,
  columns,
  columnChecks,
  data,
  loading,
  getData,
  scrollX,
  tablePagination,
  exportItems,
  params,
  handleSearch,
  handleReset
} = useManageTable({
  tableKey: 'manage_user',
  api: fetchUserList,
  sortable: true,
  columns: () => {
    const tableColumns: NaiveUI.TableColumn<Api.SystemManage.User>[] = [];

    // hide the operate column when the route has no row buttons
    if (rowButtons.value.length) {
      tableColumns.push({
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: operateColumnWidth.value,
        render: (row: Api.SystemManage.User) =>
          h(TableRowOperation, {
            options: getOperateOptions(row),
            onSelect: (key: string) => handleRowAction(row, key)
          })
      });
    }

    tableColumns.push(
      { type: 'selection', align: 'center', width: 48 },
      {
        key: 'username',
        title: $t('page.manage.user.username'),
        align: 'center',
        minWidth: 100,
        render: row =>
          h(
            NButton,
            { text: true, type: 'primary', onClick: () => handleUserDetail(row.id) },
            { default: () => row.username }
          )
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

          return h(
            NTag,
            { type, size: 'small', bordered: false },
            { default: () => $t(userStateRecord[row.stateEnum]) }
          );
        }
      },
      { key: 'registerTime', title: $t('page.manage.user.registerTime'), align: 'center', minWidth: 170 },
      { key: 'lastLoginTime', title: $t('page.manage.user.lastLoginTime'), align: 'center', minWidth: 170 }
    );

    return tableColumns;
  }
});

// the operate column is driven by the backend row buttons; keep it visible and leftmost
watch(
  rowButtons,
  () => {
    const index = columnChecks.value.findIndex(check => check.key === 'operate');

    if (index < 0) return;

    const [operateCheck] = columnChecks.value.splice(index, 1);

    operateCheck.checked = rowButtons.value.length > 0;
    columnChecks.value.unshift(operateCheck);
  },
  { immediate: true }
);

/** Toolbar buttons (position `top`), text comes from the backend button `name` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleAdd, search: handleSearch };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

const { drawerVisible, openDrawer, closeDrawer, operateType, editingData, checkedRowKeys } = useTableOperate(
  data,
  'id',
  getData
);

/** rows currently checked in the table, used by the toolbar button state rules */
const selectedRows = computed(() => data.value.filter(row => checkedRowKeys.value.includes(row.id)));

/** whether a toolbar button is disabled by its rules and the current selection */
function isToolbarButtonDisabled(button: Api.SystemManage.ButtonNode) {
  return isButtonDisabled(button.click, selectedRows.value, 'top');
}

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
        await getData();
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
  await getData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <QueryFilter
      v-model="searchConditions"
      :fields="searchFields"
      class="shrink-0"
      @search="handleSearch"
      @reset="handleReset"
    />
    <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
      <template #header>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @add="handleAdd" @refresh="getData">
          <template #default>
            <TableToolbarButtons
              :buttons="toolbarButtons"
              :disabled="isToolbarButtonDisabled"
              @select="handleToolbarAction"
            />
          </template>
          <template #export>
            <TableExportButton :api="() => fetchUserExport({ ...params, exportItems })" />
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="row => row.id"
        :pagination="tablePagination"
        :paginate-single-page="true"
        :scroll-x="scrollX"
        remote
        flex-height
        class="h-full"
      />
    </NCard>
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

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
