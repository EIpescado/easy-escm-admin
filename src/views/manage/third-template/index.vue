<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchPageSearch, fetchToggleThirdTemplateState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { TEMPLATE_CONFIG_FIELDS } from '@/constants/third-config';
import { showConfirmDialog, translateOptions, formatConfigPreview } from '@/utils/common';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import ThirdTemplateOperateModal from './modules/third-template-operate-modal.vue';

defineOptions({
  name: 'ManageThirdTemplate'
});

/** message templates and third-party channels, used by the selects and to render their names */
const templates = ref<Api.SystemManage.MsgTemplate[]>([]);
const channels = ref<Api.SystemManage.ThirdChannel[]>([]);

const templateLabelMap = computed(
  () =>
    new Map(
      templates.value.map(template => [
        template.id,
        template.title ? `${template.code} - ${template.title}` : template.code
      ])
    )
);

const channelLabelMap = computed(
  () =>
    new Map(
      channels.value.map(channel => [
        channel.id,
        channel.type ? `${channel.name} (${channel.type})` : (channel.name ?? channel.id)
      ])
    )
);

/** channel id → type, decides the template config fields of a row */
const channelTypeMap = computed(() => new Map(channels.value.map(channel => [channel.id, channel.type ?? ''])));

async function loadOptions() {
  const [templateResult, channelResult] = await Promise.all([
    fetchPageSearch<Api.SystemManage.MsgTemplate>('/system/msgTemplate/search', {
      page: 1,
      size: 500,
      items: [],
      orders: []
    }),
    fetchPageSearch<Api.SystemManage.ThirdChannel>('/system/third/search', {
      page: 1,
      size: 200,
      items: [],
      orders: []
    })
  ]);

  if (!templateResult.error) {
    templates.value = templateResult.data?.rows ?? [];
  }

  if (!channelResult.error) {
    channels.value = channelResult.data?.rows ?? [];
  }
}

onMounted(loadOptions);
// reload when the page is re-activated, the templates / channels may have been extended meanwhile
onActivated(loadOptions);

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.thirdTemplate.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'templateId',
    label: $t('page.manage.thirdTemplate.template'),
    valueType: 'select',
    types: ['eq'],
    options: templates.value.map(template => ({
      label: template.title ? `${template.code} - ${template.title}` : template.code,
      value: template.id
    }))
  },
  {
    prop: 'thirdId',
    label: $t('page.manage.thirdTemplate.third'),
    valueType: 'select',
    types: ['eq'],
    options: channels.value.map(channel => ({
      label: channel.type ? `${channel.name} (${channel.type})` : (channel.name ?? channel.id),
      value: channel.id
    }))
  },
  { prop: 'name', label: $t('page.manage.thirdTemplate.name'), valueType: 'text', types: ['like'] },
  {
    prop: 'state',
    label: $t('page.manage.thirdTemplate.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.ThirdTemplate>[]>(() => [
  {
    key: 'templateId',
    title: $t('page.manage.thirdTemplate.template'),
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: row => (row.templateId ? (templateLabelMap.value.get(row.templateId) ?? row.templateId) : '')
  },
  {
    key: 'thirdId',
    title: $t('page.manage.thirdTemplate.third'),
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: row => (row.thirdId ? (channelLabelMap.value.get(row.thirdId) ?? row.thirdId) : '')
  },
  { key: 'name', title: $t('page.manage.thirdTemplate.name'), minWidth: 180, ellipsis: { tooltip: true } },
  {
    key: 'config',
    title: $t('page.manage.thirdTemplate.config'),
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: row =>
      formatConfigPreview(
        row.config,
        row.thirdId ? TEMPLATE_CONFIG_FIELDS[channelTypeMap.value.get(row.thirdId) ?? ''] : undefined
      )
  },
  { key: 'state', title: $t('page.manage.thirdTemplate.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.thirdTemplate.remark'), minWidth: 150, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.thirdTemplate.createTime'), align: 'center', minWidth: 170 }
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
const editingData = ref<Api.SystemManage.ThirdTemplate | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.ThirdTemplate) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

function handleSetState(row: Api.SystemManage.ThirdTemplate, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.thirdTemplate.enableConfirm' : 'page.manage.thirdTemplate.disableConfirm', {
      name: row.name
    }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleThirdTemplateState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: the backend To returns the bare `ON` / `OFF` state, without `stateEnum` */
const buttonRules: PageButtonStateRules<Api.SystemManage.ThirdTemplate> = {
  enable: ({ rows }) => !rows.some(row => row.state !== 'ON'),
  disable: ({ rows }) => !rows.some(row => row.state === 'ON'),
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
function handleRowAction(row: Api.SystemManage.ThirdTemplate, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.ThirdTemplate) => void> = {
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
      table-key="manage_third-template"
      class="min-h-0 flex-1"
      url="/system/thirdTemplate/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <ThirdTemplateOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
