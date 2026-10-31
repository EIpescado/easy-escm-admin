<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { fetchCallbackReExecute } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { showConfirmDialog } from '@/utils/common';
import { getTodayRange } from '@/utils/date';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import CallbackContentModal from './modules/callback-content-modal.vue';

defineOptions({
  name: 'ManageCallback'
});

/** dictionary holding the callback types, used by the type column and the search select */
const DICT_CALLBACK_TYPE = 'system_callback_type';

/** the JSON dialog of the request / response content */
const contentVisible = ref(false);
const contentTitle = ref('');
const contentValue = ref<string | null>(null);

function openContent(title: string, content?: string | null) {
  contentTitle.value = title;
  contentValue.value = content ?? null;
  contentVisible.value = true;
}

/** render the content cell as a button that opens the JSON dialog */
function renderContent(row: Api.SystemManage.Callback, key: 'requestContent' | 'responseContent') {
  const content = row[key];

  if (!content) return '';

  return h(
    NButton,
    {
      text: true,
      type: 'primary',
      onClick: () =>
        openContent(
          $t(key === 'requestContent' ? 'page.manage.callback.viewRequest' : 'page.manage.callback.viewResponse'),
          content
        )
    },
    { default: () => $t('page.manage.callback.view') }
  );
}

/** yes / no options of the `showRequestContent` / `showResponseContent` flags */
const flagOptions = computed(() => [
  { label: $t('common.yesOrNo.yes'), value: 'true' },
  { label: $t('common.yesOrNo.no'), value: 'false' }
]);

/**
 * Search fields of the query filter
 *
 * `showRequestContent` / `showResponseContent` are top-level Qo params, not entity fields: they are
 * marked with `param: true` so they are merged into the request body instead of being sent inside
 * `items`. The payloads live in a side table and are only joined in when those flags are true.
 */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'requestTime',
    label: $t('page.manage.callback.requestTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq'],
    defaultValues: getTodayRange()
  },
  {
    prop: 'type',
    label: $t('page.manage.callback.type'),
    valueType: 'select',
    types: ['eq'],
    remote: { source: 'dict', dictCode: DICT_CALLBACK_TYPE }
  },
  { prop: 'name', label: $t('page.manage.callback.name'), valueType: 'text', types: ['like'] },
  {
    prop: 'success',
    label: $t('page.manage.callback.success'),
    valueType: 'select',
    types: ['eq'],
    options: [
      { label: $t('page.manage.callback.successYes'), value: '1' },
      { label: $t('page.manage.callback.successNo'), value: '0' }
    ]
  },
  {
    prop: 'showRequestContent',
    label: $t('page.manage.callback.showRequestContent'),
    valueType: 'select',
    types: ['eq'],
    param: true,
    options: flagOptions.value
  },
  {
    prop: 'showResponseContent',
    label: $t('page.manage.callback.showResponseContent'),
    valueType: 'select',
    types: ['eq'],
    param: true,
    options: flagOptions.value
  }
]);

/** Data columns; the selection column is added by the list */
const columns = computed<NaiveUI.TableColumn<Api.SystemManage.Callback>[]>(() => [
  { key: 'id', title: $t('page.manage.callback.id'), align: 'center', width: 190, ellipsis: { tooltip: true } },
  {
    key: 'type',
    title: $t('page.manage.callback.type'),
    align: 'center',
    width: 140,
    render: row => {
      const type = row.typeVal || row.type;

      return type ? h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => type }) : '';
    }
  },
  { key: 'name', title: $t('page.manage.callback.name'), minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'success',
    title: $t('page.manage.callback.success'),
    align: 'center',
    width: 100,
    render: row => {
      if (row.success === null || row.success === undefined) return '';

      const ok = row.success;

      return h(
        NTag,
        { size: 'small', bordered: false, type: ok ? 'success' : 'error' },
        { default: () => $t(ok ? 'page.manage.callback.successYes' : 'page.manage.callback.successNo') }
      );
    }
  },
  { key: 'subject', title: $t('page.manage.callback.subject'), minWidth: 140, ellipsis: { tooltip: true } },
  { key: 'primaryKey', title: $t('page.manage.callback.primaryKey'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'traceId', title: $t('page.manage.callback.traceId'), minWidth: 180, ellipsis: { tooltip: true } },
  {
    key: 'creator',
    title: $t('page.manage.callback.creator'),
    align: 'center',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  { key: 'requestTime', title: $t('page.manage.callback.requestTime'), align: 'center', minWidth: 170 },
  {
    key: 'requestContent',
    title: $t('page.manage.callback.requestContent'),
    align: 'center',
    width: 100,
    render: row => renderContent(row, 'requestContent')
  },
  {
    key: 'responseContent',
    title: $t('page.manage.callback.responseContent'),
    align: 'center',
    width: 100,
    render: row => renderContent(row, 'responseContent')
  }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the checked rows to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
  selectedRows: Api.SystemManage.Callback[];
}

const listRef = ref<ManageListInstance | null>(null);

/** Button state rules: re-execute needs a selection (the row position always passes a single row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.Callback> = {
  reExecute: ({ rows }) => rows.length === 0
};

/** re-execute the given callback records */
function reExecute(rows: Api.SystemManage.Callback[]) {
  if (!rows.length) return;

  showConfirmDialog({
    content: $t('page.manage.callback.reExecuteConfirm', { count: rows.length }),
    positiveText: $t('system.callback.reExecute'),
    onConfirm: async () => {
      const { error } = await fetchCallbackReExecute(rows.map(row => row.id));

      if (!error) {
        window.$message?.success($t('page.manage.callback.reExecuteSuccess'));
        await listRef.value?.getData();
      }
    }
  });
}

/** Toolbar buttons, dispatched by the backend button `click` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  if (button.click === 'reExecute') {
    reExecute(listRef.value?.selectedRows ?? []);

    return;
  }

  window.$message?.info($t('common.lookForward'));
}

/** Row action handlers, dispatched by the backend button `click` */
function handleRowAction(row: Api.SystemManage.Callback, click: string) {
  if (click === 'reExecute') {
    reExecute([row]);

    return;
  }

  window.$message?.info($t('common.lookForward'));
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_callback"
      class="min-h-0 flex-1"
      url="/system/callback/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      selection
      @toolbar-action="handleToolbarAction"
    />
    <CallbackContentModal v-model:visible="contentVisible" :title="contentTitle" :content="contentValue" />
  </div>
</template>
