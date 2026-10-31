<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import NoOperateModal from './modules/no-operate-modal.vue';

defineOptions({
  name: 'ManageNo'
});

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.no.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  { prop: 'docType', label: $t('page.manage.no.docType'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'prefix', label: $t('page.manage.no.prefix'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'remark', label: $t('page.manage.no.remark'), valueType: 'text', types: ['like'] }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.NoRule>[]>(() => [
  { key: 'docType', title: $t('page.manage.no.docType'), minWidth: 150, ellipsis: { tooltip: true } },
  { key: 'prefix', title: $t('page.manage.no.prefix'), align: 'center', width: 110 },
  { key: 'format', title: $t('page.manage.no.format'), align: 'center', width: 110 },
  { key: 'template', title: $t('page.manage.no.template'), minWidth: 180, ellipsis: { tooltip: true } },
  { key: 'currentNo', title: $t('page.manage.no.currentNo'), align: 'center', width: 120 },
  { key: 'bit', title: $t('page.manage.no.bit'), align: 'center', width: 100 },
  { key: 'batchNumber', title: $t('page.manage.no.batchNumber'), align: 'center', width: 130 },
  { key: 'lastFetchTime', title: $t('page.manage.no.lastFetchTime'), align: 'center', minWidth: 170 },
  { key: 'remark', title: $t('page.manage.no.remark'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.no.createTime'), align: 'center', minWidth: 170 }
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
const editingData = ref<Api.SystemManage.NoRule | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.NoRule) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

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
function handleRowAction(row: Api.SystemManage.NoRule, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.NoRule) => void> = { update: handleEdit };

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
      table-key="manage_no"
      class="min-h-0 flex-1"
      url="/system/no/search"
      :fields="searchFields"
      :columns="getColumns"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <NoOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
