<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchToggleMsgTemplateState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import MsgTemplateOperateModal from './modules/msg-template-operate-modal.vue';

defineOptions({
  name: 'ManageMsgTemplate'
});

/** dictionary holding the message types, used by the type column and the search select */
const DICT_TEMPLATE_TYPE = 'system_msg_template_type';

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.msgTemplate.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  { prop: 'code', label: $t('page.manage.msgTemplate.code'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'title', label: $t('page.manage.msgTemplate.title'), valueType: 'text', types: ['like'] },
  {
    prop: 'type',
    label: $t('page.manage.msgTemplate.type'),
    valueType: 'select',
    types: ['eq'],
    remote: { source: 'dict', dictCode: DICT_TEMPLATE_TYPE }
  },
  {
    prop: 'state',
    label: $t('page.manage.msgTemplate.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  }
]);

/** Data columns; the operate and selection columns are added by the list */
const columns = computed<ManageColumn<Api.SystemManage.MsgTemplate>[]>(() => [
  { key: 'code', title: $t('page.manage.msgTemplate.code'), minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'type',
    title: $t('page.manage.msgTemplate.type'),
    align: 'center',
    width: 130,
    render: row => {
      const type = row.typeVal || row.type;

      return type ? h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => type }) : '';
    }
  },
  { key: 'title', title: $t('page.manage.msgTemplate.title'), minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'titleDesc',
    title: $t('page.manage.msgTemplate.titleDesc'),
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  { key: 'sn', title: $t('page.manage.msgTemplate.sn'), align: 'center', width: 90 },
  {
    key: 'whetherConfirm',
    title: $t('page.manage.msgTemplate.whetherConfirm'),
    align: 'center',
    width: 120,
    cell: 'boolean'
  },
  { key: 'hidden', title: $t('page.manage.msgTemplate.hidden'), align: 'center', width: 120, cell: 'boolean' },
  { key: 'state', title: $t('page.manage.msgTemplate.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.msgTemplate.remark'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.msgTemplate.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the checked rows to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
  selectedRows: Api.SystemManage.MsgTemplate[];
}

const listRef = ref<ManageListInstance | null>(null);

async function refreshList() {
  await listRef.value?.getData();
}

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.MsgTemplate | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.MsgTemplate) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

function handleSetState(row: Api.SystemManage.MsgTemplate, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.msgTemplate.enableConfirm' : 'page.manage.msgTemplate.disableConfirm', {
      name: row.code
    }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleMsgTemplateState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: enable / disable / edit work on the checked rows (or the current row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.MsgTemplate> = {
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
function handleRowAction(row: Api.SystemManage.MsgTemplate, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.MsgTemplate) => void> = {
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
      table-key="manage_msg-template"
      class="min-h-0 flex-1"
      url="/system/msgTemplate/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      selection
      @toolbar-action="handleToolbarAction"
    />
    <MsgTemplateOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
