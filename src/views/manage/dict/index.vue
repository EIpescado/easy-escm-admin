<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import { NEllipsis, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { FORM_DETAIL_LOAD_DELAY, sleep } from '@/hooks/common/form';
import {
  getButtonLabel,
  usePageButtonState,
  usePageButtons,
  type PageButtonStateRules
} from '@/hooks/business/page-buttons';
import {
  fetchDictDetail,
  fetchDictEntryDetail,
  fetchDictEntrySearch,
  fetchDictSearch,
  fetchToggleDictEntryState,
  fetchToggleDictState
} from '@/service/api';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import { toQueryItems, type QueryField, type QueryFilterCondition } from '@/components/advanced/query-filter/types';
import DictOperateModal from './modules/dict-operate-modal.vue';
import DictEntryOperateModal from './modules/dict-entry-operate-modal.vue';

defineOptions({
  name: 'ManageDict'
});

/** whether an `AbleStateEnum` node is enabled (the enum name is exposed as `stateEnum`) */
function isEnabled(stateEnum?: string) {
  return stateEnum === 'ON';
}

/** keep a text column on a single line, showing a tooltip when it overflows */
function renderEllipsis(text?: string | number | null) {
  return h(NEllipsis, { tooltip: true }, { default: () => String(text ?? '') || '-' });
}

/** Buttons of the current route, provided by the backend menu tree */
const { toolbarButtons, rowButtons, leftTopButtons, leftRowButtons } = usePageButtons();

/** ---------------- dict main list ---------------- */

const dictSearchFields = computed<QueryField[]>(() => [
  // the backend searches the code and the name with a mixed `like`, so they are merged into one
  // keyword condition (label 关键字, placeholder 字典编码 / 字典名称, fixed operator 包含)
  {
    prop: 'code',
    label: $t('page.manage.dict.code'),
    fast: true
  },
  {
    prop: 'name',
    label: $t('page.manage.dict.name'),
    fast: true
  },
  {
    prop: 'state',
    label: $t('page.manage.dict.stateLabel'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq', 'ne'],
    options: translateOptions(enableStateOptions)
  }
]);

const dictConditions = ref<QueryFilterCondition[]>([]);

const dictParams = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: [],
  orders: []
});

const dictButtonRules: PageButtonStateRules<Api.SystemManage.Dict> = {
  enable: ({ rows }) => rows.every(row => isEnabled(row.stateEnum)),
  disable: ({ rows }) => rows.every(row => !isEnabled(row.stateEnum)),
  update: ({ rows }) => rows.length !== 1,
  edit: ({ rows }) => rows.length !== 1
};

const { isDisabled: isDictButtonDisabled } = usePageButtonState(dictButtonRules);

const dictOperateWidth = computed(() =>
  getTableOperateColumnWidth(rowButtons.value.map(button => getButtonLabel(button)))
);

function getDictOperateOptions(row: Api.SystemManage.Dict) {
  return rowButtons.value.map(button => ({
    key: button.click ?? button.name,
    label: getButtonLabel(button),
    disabled: isDictButtonDisabled(button.click, [row], 'row'),
    icon: button.icon || undefined
  }));
}

const {
  columns: dictColumns,
  data: dictData,
  loading: dictLoading,
  getData: getDictData,
  getDataByPage: getDictDataByPage,
  mobilePagination: dictPagination,
  scrollX: dictScrollX
} = useNaivePaginatedTable({
  tableKey: 'manage_dict',
  api: () => fetchDictSearch(dictParams),
  transform: response => {
    const { data: resData, error } = response;

    if (!error) {
      const { rows, page, size, total } = resData;

      return { data: rows || [], pageNum: page, pageSize: size, total };
    }

    return { data: [], pageNum: 1, pageSize: 10, total: 0 };
  },
  columns: () => {
    const columns: NaiveUI.TableColumn<Api.SystemManage.Dict>[] = [];

    if (rowButtons.value.length) {
      columns.push({
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: dictOperateWidth.value,
        render: (row: Api.SystemManage.Dict) =>
          h(TableRowOperation, {
            options: getDictOperateOptions(row),
            onSelect: (key: string) => handleDictRowAction(row, key)
          })
      });
    }

    columns.push(
      {
        key: 'code',
        title: $t('page.manage.dict.code'),
        minWidth: 160,
        render: (row: Api.SystemManage.Dict) => renderEllipsis(row.code)
      },
      {
        key: 'name',
        title: $t('page.manage.dict.name'),
        minWidth: 160,
        render: (row: Api.SystemManage.Dict) => renderEllipsis(row.name)
      },
      {
        key: 'state',
        title: $t('page.manage.dict.stateLabel'),
        align: 'center',
        width: 90,
        render: (row: Api.SystemManage.Dict) =>
          h(
            NTag,
            { type: isEnabled(row.stateEnum) ? 'success' : 'error', size: 'small', bordered: false },
            { default: () => $t(isEnabled(row.stateEnum) ? 'page.manage.dict.enabled' : 'page.manage.dict.disabled') }
          )
      },
      {
        key: 'whetherAuth',
        title: $t('page.manage.dict.whetherAuth'),
        align: 'center',
        width: 100,
        render: (row: Api.SystemManage.Dict) =>
          h(
            NTag,
            { type: row.whetherAuth ? 'warning' : 'default', size: 'small', bordered: false },
            { default: () => $t(row.whetherAuth ? 'common.yesOrNo.yes' : 'common.yesOrNo.no') }
          )
      },
      {
        key: 'remark',
        title: $t('page.manage.dict.remark'),
        minWidth: 160,
        render: (row: Api.SystemManage.Dict) => renderEllipsis(row.remark)
      }
    );

    return columns;
  },
  onPaginationParamsChange: paginationParams => {
    dictParams.page = paginationParams.page ?? 1;
    dictParams.size = paginationParams.pageSize ?? 10;
  }
});

/** ---------------- dict entry list ---------------- */

/** selected dictionary (from the dict list), used to filter the entries list */
const activeDictId = ref('');
const activeDictName = computed(() => dictData.value.find(row => row.id === activeDictId.value)?.name ?? '');

function dictRowClassName(row: Api.SystemManage.Dict) {
  return row.id === activeDictId.value ? 'dict-row--active' : '';
}

function dictRowProps(row: Api.SystemManage.Dict) {
  return {
    style: 'cursor: pointer',
    onClick: (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.n-button')) return;

      selectDict(row);
    }
  };
}

const entrySearchFields = computed<QueryField[]>(() => [
  // the backend searches these five fields with a mixed `like`, so they are merged into one keyword
  // condition (label 关键字, placeholder 明细编码 / 值 / 值2 / 值3 / 值4, fixed operator 包含)
  // `val2` ~ `val4` are only searched by the keyword, they are never rendered on their own
  { prop: 'code', label: $t('page.manage.dict.entry.code'), fast: true },
  { prop: 'val', label: $t('page.manage.dict.entry.val'), fast: true },
  { prop: 'val2', label: $t('page.manage.dict.entry.val2'), fast: true },
  { prop: 'val3', label: $t('page.manage.dict.entry.val3'), fast: true },
  { prop: 'val4', label: $t('page.manage.dict.entry.val4'), fast: true }
]);

const entryConditions = ref<QueryFilterCondition[]>([]);

const entryParams = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: [],
  orders: []
});

const entryButtonRules: PageButtonStateRules<Api.SystemManage.DictEntry> = {
  enable: ({ rows }) => rows.every(row => isEnabled(row.stateEnum)),
  disable: ({ rows }) => rows.every(row => !isEnabled(row.stateEnum)),
  update: ({ rows }) => rows.length !== 1,
  edit: ({ rows }) => rows.length !== 1
};

const { isDisabled: isEntryButtonDisabled } = usePageButtonState(entryButtonRules);

const entryOperateWidth = computed(() =>
  getTableOperateColumnWidth(leftRowButtons.value.map(button => getButtonLabel(button)))
);

function getEntryOperateOptions(row: Api.SystemManage.DictEntry) {
  return leftRowButtons.value.map(button => ({
    key: button.click ?? button.name,
    label: getButtonLabel(button),
    disabled: isEntryButtonDisabled(button.click, [row], 'left-row'),
    icon: button.icon || undefined
  }));
}

const {
  columns: entryColumns,
  data: entryData,
  loading: entryLoading,
  getData: getEntryData,
  getDataByPage: getEntryDataByPage,
  mobilePagination: entryPagination,
  scrollX: entryScrollX
} = useNaivePaginatedTable({
  tableKey: 'manage_dict_entry',
  // the entries list is linked to the selected dictionary, so do not fetch on mount
  immediate: false,
  api: () => fetchDictEntrySearch(entryParams),
  transform: response => {
    const { data: resData, error } = response;

    if (!error) {
      const { rows, page, size, total } = resData;

      return { data: rows || [], pageNum: page, pageSize: size, total };
    }

    return { data: [], pageNum: 1, pageSize: 10, total: 0 };
  },
  columns: () => {
    const columns: NaiveUI.TableColumn<Api.SystemManage.DictEntry>[] = [];

    if (leftRowButtons.value.length) {
      columns.push({
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: entryOperateWidth.value,
        render: (row: Api.SystemManage.DictEntry) =>
          h(TableRowOperation, {
            options: getEntryOperateOptions(row),
            onSelect: (key: string) => handleEntryRowAction(row, key)
          })
      });
    }

    columns.push(
      {
        key: 'code',
        title: $t('page.manage.dict.entry.code'),
        minWidth: 140,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.code)
      },
      {
        key: 'val',
        title: $t('page.manage.dict.entry.val'),
        minWidth: 120,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.val)
      },
      {
        key: 'val2',
        title: $t('page.manage.dict.entry.val2'),
        minWidth: 110,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.val2)
      },
      {
        key: 'val3',
        title: $t('page.manage.dict.entry.val3'),
        minWidth: 110,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.val3)
      },
      {
        key: 'val4',
        title: $t('page.manage.dict.entry.val4'),
        minWidth: 110,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.val4)
      },
      { key: 'sn', title: $t('page.manage.dict.entry.sn'), align: 'center', width: 80 },
      {
        key: 'state',
        title: $t('page.manage.dict.stateLabel'),
        align: 'center',
        width: 90,
        render: (row: Api.SystemManage.DictEntry) =>
          h(
            NTag,
            { type: isEnabled(row.stateEnum) ? 'success' : 'error', size: 'small', bordered: false },
            { default: () => $t(isEnabled(row.stateEnum) ? 'page.manage.dict.enabled' : 'page.manage.dict.disabled') }
          )
      },
      {
        key: 'remark',
        title: $t('page.manage.dict.entry.remark'),
        minWidth: 140,
        render: (row: Api.SystemManage.DictEntry) => renderEllipsis(row.remark)
      }
    );

    return columns;
  },
  onPaginationParamsChange: paginationParams => {
    entryParams.page = paginationParams.page ?? 1;
    entryParams.size = paginationParams.pageSize ?? 10;
  }
});

/** ---------------- modals & actions ---------------- */

const { bool: dictModalVisible, setTrue: openDictModal, setFalse: closeDictModal } = useBoolean();
const dictOperateType = ref<NaiveUI.TableOperateType>('add');
const editingDict = ref<Api.SystemManage.DictForm | null>(null);

const { bool: entryModalVisible, setTrue: openEntryModal, setFalse: closeEntryModal } = useBoolean();
const entryOperateType = ref<NaiveUI.TableOperateType>('add');
const editingEntry = ref<Api.SystemManage.DictEntryForm | null>(null);

/** increments on every edit to drop the response of a superseded request */
let dictDetailToken = 0;
let entryDetailToken = 0;

function handleDictAdd() {
  dictOperateType.value = 'add';
  editingDict.value = null;
  openDictModal();
}

async function handleDictEdit(row: Api.SystemManage.Dict) {
  dictOperateType.value = 'edit';
  // open first so the dialog shows its skeleton, then load the detail
  editingDict.value = null;
  openDictModal();

  const token = ++dictDetailToken;
  await sleep(FORM_DETAIL_LOAD_DELAY);

  // aborted while waiting (dialog closed or another row selected)
  if (token !== dictDetailToken || !dictModalVisible.value || dictOperateType.value !== 'edit') return;

  const { data, error } = await fetchDictDetail(row.id);

  // drop the response if the dialog changed while loading
  if (token !== dictDetailToken || !dictModalVisible.value || dictOperateType.value !== 'edit') return;

  if (!error && data) {
    editingDict.value = { ...data, state: row.stateEnum };
  }
}

function handleDictSetState(row: Api.SystemManage.Dict, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.dict.enableConfirm' : 'page.manage.dict.disableConfirm', { name: row.name }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleDictState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await getDictData();
      }
    }
  });
}

const dictRowHandlers: Record<string, (row: Api.SystemManage.Dict) => void> = {
  update: row => handleDictEdit(row),
  edit: row => handleDictEdit(row),
  enable: row => handleDictSetState(row, true),
  disable: row => handleDictSetState(row, false)
};

function handleDictRowAction(row: Api.SystemManage.Dict, key: string) {
  const handler = dictRowHandlers[key];

  if (handler) handler(row);
  else window.$message?.info($t('common.lookForward'));
}

function handleDictToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleDictAdd };
  const handler = handlers[button.click ?? ''];

  if (handler) handler();
  else window.$message?.info($t('common.lookForward'));
}

async function handleEntryAdd() {
  entryOperateType.value = 'add';
  editingEntry.value = null;
  openEntryModal();
}

async function handleEntryEdit(row: Api.SystemManage.DictEntry) {
  entryOperateType.value = 'edit';
  // open first so the dialog shows its skeleton, then load the detail
  editingEntry.value = null;
  openEntryModal();

  const token = ++entryDetailToken;
  await sleep(FORM_DETAIL_LOAD_DELAY);

  // aborted while waiting (dialog closed or another row selected)
  if (token !== entryDetailToken || !entryModalVisible.value || entryOperateType.value !== 'edit') return;

  const { data, error } = await fetchDictEntryDetail(row.id);

  // drop the response if the dialog changed while loading
  if (token !== entryDetailToken || !entryModalVisible.value || entryOperateType.value !== 'edit') return;

  if (!error && data) {
    editingEntry.value = { ...data, state: row.stateEnum, sn: row.sn };
  }
}

function handleEntrySetState(row: Api.SystemManage.DictEntry, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.dict.enableConfirm' : 'page.manage.dict.disableConfirm', { name: row.code }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleDictEntryState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await getEntryData();
      }
    }
  });
}

const entryRowHandlers: Record<string, (row: Api.SystemManage.DictEntry) => void> = {
  update: row => handleEntryEdit(row),
  edit: row => handleEntryEdit(row),
  enable: row => handleEntrySetState(row, true),
  disable: row => handleEntrySetState(row, false)
};

function handleEntryRowAction(row: Api.SystemManage.DictEntry, key: string) {
  const handler = entryRowHandlers[key];

  if (handler) handler(row);
  else window.$message?.info($t('common.lookForward'));
}

function handleEntryToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleEntryAdd, add: handleEntryAdd };
  const handler = handlers[button.click ?? ''];

  if (handler) handler();
  else window.$message?.info($t('common.lookForward'));
}

/** Entry toolbar actions that create an entry, they need a selected dictionary */
const ENTRY_CREATE_ACTIONS = ['create', 'add'];

/** Creating an entry requires a selected dictionary, the other actions do not */
function isEntryToolbarButtonDisabled(button: Api.SystemManage.ButtonNode) {
  return !activeDictId.value && ENTRY_CREATE_ACTIONS.includes(button.click ?? '');
}

function handleDictSearch() {
  dictParams.items = toQueryItems(dictConditions.value);
  dictParams.page = 1;

  getDictDataByPage(1);
}

function handleDictReset() {
  dictParams.items = [];
  dictParams.page = 1;
}

/** build the entries query items: the query-bar conditions plus the linked dictionary */
function buildEntryItems() {
  const items = toQueryItems(entryConditions.value);

  if (activeDictId.value) {
    items.push({ prop: 'pid', values: [activeDictId.value], type: 'eq' });
  }

  return items;
}

/** select a dictionary and refresh the linked entries list */
async function selectDict(row: Api.SystemManage.Dict) {
  activeDictId.value = row.id;
  entryParams.page = 1;
  entryParams.items = buildEntryItems();

  await getEntryDataByPage(1);
}

/** clear the link when the selected dictionary is no longer in the list */
watch(dictData, rows => {
  if (!rows.some(row => row.id === activeDictId.value)) {
    activeDictId.value = '';
    entryParams.items = buildEntryItems();
  }
});

function handleEntrySearch() {
  entryParams.items = buildEntryItems();
  entryParams.page = 1;

  getEntryDataByPage(1);
}

function handleEntryReset() {
  entryParams.items = buildEntryItems();
  entryParams.page = 1;
}
async function handleDictSubmitted() {
  closeDictModal();
  // only the list has to be refreshed here: the entry form select reloads when that form opens
  await getDictData();

  // if a dictionary is selected on the right, reload its entries once (the change may affect them)
  if (activeDictId.value) {
    await getEntryData();
  }
}

async function handleEntrySubmitted() {
  closeEntryModal();
  await getEntryData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 gap-16px overflow-hidden">
    <div class="min-w-0 min-h-0 flex flex-[6] flex-col gap-16px overflow-hidden">
      <QueryFilter
        v-model="dictConditions"
        :fields="dictSearchFields"
        class="shrink-0"
        @search="handleDictSearch"
        @reset="handleDictReset"
      />
      <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
        <template #header>
          <div class="flex items-center justify-between">
            <span>{{ $t('route.manage_dict') }}</span>
            <TableToolbarButtons :buttons="toolbarButtons" @select="handleDictToolbarAction" />
          </div>
        </template>
        <NDataTable
          :columns="dictColumns"
          :data="dictData"
          :loading="dictLoading"
          :row-key="row => row.id"
          :row-class-name="dictRowClassName"
          :row-props="dictRowProps"
          :pagination="dictPagination"
          :paginate-single-page="true"
          :scroll-x="dictScrollX"
          remote
          flex-height
          class="h-full"
        />
      </NCard>
    </div>
    <div class="min-w-0 min-h-0 flex flex-[4] flex-col gap-16px overflow-hidden">
      <QueryFilter
        v-model="entryConditions"
        :fields="entrySearchFields"
        class="shrink-0"
        @search="handleEntrySearch"
        @reset="handleEntryReset"
      />
      <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="truncate">
              {{
                activeDictId
                  ? `${$t('page.manage.dict.entry.title')} · ${activeDictName}`
                  : $t('page.manage.dict.entry.title')
              }}
            </span>
            <TableToolbarButtons
              :buttons="leftTopButtons"
              :disabled="isEntryToolbarButtonDisabled"
              @select="handleEntryToolbarAction"
            />
          </div>
        </template>
        <NDataTable
          :columns="entryColumns"
          :data="entryData"
          :loading="entryLoading"
          :row-key="row => row.id"
          :pagination="entryPagination"
          :paginate-single-page="true"
          :scroll-x="entryScrollX"
          remote
          flex-height
          class="h-full"
        />
      </NCard>
    </div>
    <DictOperateModal
      v-model:visible="dictModalVisible"
      :operate-type="dictOperateType"
      :row="editingDict"
      @submitted="handleDictSubmitted"
    />
    <DictEntryOperateModal
      v-model:visible="entryModalVisible"
      :operate-type="entryOperateType"
      :row="editingEntry"
      :active-dict-id="activeDictId"
      @submitted="handleEntrySubmitted"
    />
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* the selected dictionary row */
:deep(.dict-row--active .n-data-table-td) {
  background-color: var(--n-td-color-hover, rgba(0, 0, 0, 0.04));
}
</style>
