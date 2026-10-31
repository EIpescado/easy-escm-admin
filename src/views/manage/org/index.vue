<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchToggleOrgState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import OrgOperateModal from './modules/org-operate-modal.vue';

defineOptions({
  name: 'ManageOrg'
});

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.org.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  { prop: 'code', label: $t('page.manage.org.code'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'name', label: $t('page.manage.org.name'), valueType: 'text', types: ['like'] },
  {
    prop: 'state',
    label: $t('page.manage.org.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  },
  { prop: 'remark', label: $t('page.manage.org.remark'), valueType: 'text', types: ['like'] }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.Org>[]>(() => [
  { key: 'code', title: $t('page.manage.org.code'), minWidth: 140, ellipsis: { tooltip: true } },
  { key: 'name', title: $t('page.manage.org.name'), minWidth: 200, ellipsis: { tooltip: true } },
  { key: 'state', title: $t('page.manage.org.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.org.remark'), minWidth: 180, ellipsis: { tooltip: true } },
  { key: 'creator', title: $t('page.manage.org.creator'), align: 'center', width: 120 },
  { key: 'createTime', title: $t('page.manage.org.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
}

const listRef = ref<ManageListInstance | null>(null);

async function refreshList() {
  await listRef.value?.getData();
}

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.Org | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.Org) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

function handleSetState(row: Api.SystemManage.Org, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.org.enableConfirm' : 'page.manage.org.disableConfirm', { name: row.name }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleOrgState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: enable / disable / edit work on the checked rows (or the current row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.Org> = {
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
function handleRowAction(row: Api.SystemManage.Org, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.Org) => void> = {
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
      table-key="manage_org"
      class="min-h-0 flex-1"
      url="/system/org/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <OrgOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
