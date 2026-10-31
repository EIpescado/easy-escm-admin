<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchToggleThirdState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import { formatConfigPreview } from '@/utils/common';
import { CHANNEL_CONFIG_FIELDS } from '@/constants/third-config';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import ThirdOperateModal from './modules/third-operate-modal.vue';

defineOptions({
  name: 'ManageThird'
});

/** dictionary holding the third-party channel types */
const DICT_THIRD_TYPE = 'system_third_type';

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.third.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'type',
    label: $t('page.manage.third.type'),
    valueType: 'select',
    types: ['eq'],
    remote: { source: 'dict', dictCode: DICT_THIRD_TYPE }
  },
  { prop: 'name', label: $t('page.manage.third.name'), valueType: 'text', types: ['like'] },
  {
    prop: 'state',
    label: $t('page.manage.third.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  },
  { prop: 'remark', label: $t('page.manage.third.remark'), valueType: 'text', types: ['like'] }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.ThirdChannel>[]>(() => [
  {
    key: 'type',
    title: $t('page.manage.third.type'),
    align: 'center',
    width: 140,
    render: row => {
      const type = row.typeVal || row.type;

      return type ? h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => type }) : '';
    }
  },
  { key: 'name', title: $t('page.manage.third.name'), minWidth: 180, ellipsis: { tooltip: true } },
  {
    key: 'config',
    title: $t('page.manage.third.config'),
    minWidth: 240,
    ellipsis: { tooltip: true },
    render: row => formatConfigPreview(row.config, row.type ? CHANNEL_CONFIG_FIELDS[row.type] : undefined)
  },
  { key: 'state', title: $t('page.manage.third.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.third.remark'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.third.createTime'), align: 'center', minWidth: 170 }
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
const editingData = ref<Api.SystemManage.ThirdChannel | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.ThirdChannel) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

function handleSetState(row: Api.SystemManage.ThirdChannel, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.third.enableConfirm' : 'page.manage.third.disableConfirm', {
      name: row.name
    }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleThirdState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: enable / disable / edit work on the checked rows (or the current row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.ThirdChannel> = {
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
function handleRowAction(row: Api.SystemManage.ThirdChannel, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.ThirdChannel) => void> = {
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
      table-key="manage_third"
      class="min-h-0 flex-1"
      url="/system/third/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <ThirdOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
