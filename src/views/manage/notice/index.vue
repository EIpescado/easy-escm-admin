<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import NoticeDetailModal from '@/components/advanced/notice-detail-modal.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import NoticeOperateModal from './modules/notice-operate-modal.vue';

defineOptions({
  name: 'ManageNotice'
});

/** dictionary holding the notice types */
const DICT_NOTICE_TYPE = 'system_notice_type';

/**
 * Search fields of the query filter
 *
 * `/system/notice/search` reads `title` / `type` from the Qo top level instead of the dynamic
 * `items`, so both are marked `param` and never sent inside `items`.
 */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'title',
    label: $t('page.manage.notice.title'),
    valueType: 'text',
    types: ['like'],
    param: true
  },
  {
    prop: 'type',
    label: $t('page.manage.notice.type'),
    valueType: 'select',
    types: ['eq'],
    param: true,
    remote: { source: 'dict', dictCode: DICT_NOTICE_TYPE }
  }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.Notice>[]>(() => [
  {
    key: 'type',
    title: $t('page.manage.notice.type'),
    align: 'center',
    width: 130,
    render: row => {
      const type = row.typeVal || row.type;

      return type ? h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => type }) : '';
    }
  },
  {
    key: 'title',
    title: $t('page.manage.notice.title'),
    minWidth: 200,
    ellipsis: { tooltip: true },
    // the title opens the read-only notice dialog, like the home page card
    render: row =>
      h(
        'a',
        {
          class: 'text-primary cursor-pointer',
          onClick: () => openDetail(row)
        },
        row.title ?? ''
      )
  },
  { key: 'onTime', title: $t('page.manage.notice.onTime'), align: 'center', minWidth: 170 },
  { key: 'offTime', title: $t('page.manage.notice.offTime'), align: 'center', minWidth: 170 },
  { key: 'creator', title: $t('page.manage.notice.creator'), align: 'center', width: 120 },
  { key: 'createTime', title: $t('page.manage.notice.createTime'), align: 'center', minWidth: 170 }
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
const editingData = ref<Api.SystemManage.Notice | null>(null);

/** read-only notice dialog opened from the title column */
const { bool: detailVisible, setTrue: openDetailModal } = useBoolean();
const detailData = ref<Api.SystemManage.Notice | null>(null);

function openDetail(row: Api.SystemManage.Notice) {
  detailData.value = row;
  openDetailModal();
}

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.Notice) {
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
function handleRowAction(row: Api.SystemManage.Notice, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.Notice) => void> = { update: handleEdit };

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
      table-key="manage_notice"
      class="min-h-0 flex-1"
      url="/system/notice/search"
      :fields="searchFields"
      :columns="getColumns"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <NoticeOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
    <NoticeDetailModal v-model:visible="detailVisible" :notice="detailData" />
  </div>
</template>
