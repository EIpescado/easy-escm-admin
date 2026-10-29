<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchToggleClientState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import ClientOperateModal from './modules/client-operate-modal.vue';

defineOptions({
  name: 'ManageClient'
});

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.client.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  { prop: 'clientId', label: $t('page.manage.client.clientId'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'grantType', label: $t('page.manage.client.grantType'), valueType: 'text', types: ['like'] },
  { prop: 'deviceType', label: $t('page.manage.client.deviceType'), valueType: 'text', types: ['like'] },
  {
    prop: 'state',
    label: $t('page.manage.client.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  },
  { prop: 'remark', label: $t('page.manage.client.remark'), valueType: 'text', types: ['like'] }
]);

/** `-1` means the token is never frozen */
function renderActiveTimeout(value?: number | null) {
  if (value === null || value === undefined) return '-';

  return value === -1 ? $t('page.manage.client.unlimited') : value;
}

/** Data columns; the operate and selection columns are added by the list */
const columns = computed<ManageColumn<Api.SystemManage.Client>[]>(() => [
  { key: 'clientId', title: $t('page.manage.client.clientId'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'grantType', title: $t('page.manage.client.grantType'), minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'deviceType',
    title: $t('page.manage.client.deviceType'),
    align: 'center',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'activeTimeout',
    title: $t('page.manage.client.activeTimeout'),
    align: 'center',
    width: 140,
    render: row => renderActiveTimeout(row.activeTimeout)
  },
  { key: 'timeout', title: $t('page.manage.client.timeout'), align: 'center', width: 130 },
  { key: 'state', title: $t('page.manage.client.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.client.remark'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.client.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the checked rows to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
  selectedRows: Api.SystemManage.Client[];
}

const listRef = ref<ManageListInstance | null>(null);

async function refreshList() {
  await listRef.value?.getData();
}

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.Client | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.Client) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

function handleSetState(row: Api.SystemManage.Client, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.client.enableConfirm' : 'page.manage.client.disableConfirm', {
      name: row.clientId
    }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleClientState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: enable / disable / edit work on the checked rows (or the current row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.Client> = {
  enable: ({ rows }) => !rows.some(row => row.stateEnum !== 'ON'),
  disable: ({ rows }) => !rows.some(row => row.stateEnum === 'ON'),
  update: ({ rows }) => rows.length !== 1
};

/** Toolbar buttons, dispatched by the backend button `click` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleAdd };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Row action handlers, dispatched by the backend button `click` */
function handleRowAction(row: Api.SystemManage.Client, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.Client) => void> = {
    update: handleEdit,
    enable: target => handleSetState(target, true),
    disable: target => handleSetState(target, false)
  };

  const handler = handlers[click];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

async function handleSubmitted() {
  closeModal();
  await refreshList();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_client"
      class="min-h-0 flex-1"
      url="/system/client/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      selection
      @toolbar-action="handleToolbarAction"
    />
    <ClientOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
