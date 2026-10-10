<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { FORM_DETAIL_LOAD_DELAY, sleep } from '@/hooks/common/form';
import { usePageButtons, type PageButtonStateRules } from '@/hooks/business/page-buttons';
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
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import DictOperateModal from './modules/dict-operate-modal.vue';
import DictEntryOperateModal from './modules/dict-entry-operate-modal.vue';

defineOptions({
  name: 'ManageDict'
});

/** whether an `AbleStateEnum` node is enabled (the enum name is exposed as `stateEnum`) */
function isEnabled(stateEnum?: string) {
  return stateEnum === 'ON';
}

/** Buttons of the current route, provided by the backend menu tree */
const { leftTopButtons, leftRowButtons } = usePageButtons();

/** the list exposes `getData` / `reload` and the loaded rows to the page */
interface ManageListInstance<Row> {
  getData: () => Promise<void>;
  reload: () => Promise<void>;
  data: Row[];
}

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
    types: ['eq', 'ne'],
    options: translateOptions(enableStateOptions)
  }
]);

const dictButtonRules: PageButtonStateRules<Api.SystemManage.Dict> = {
  enable: ({ rows }) => rows.every(row => isEnabled(row.stateEnum)),
  disable: ({ rows }) => rows.every(row => !isEnabled(row.stateEnum)),
  update: ({ rows }) => rows.length !== 1,
  edit: ({ rows }) => rows.length !== 1
};

/** Data columns of the dictionary list; the operate column is added by the list */
const dictColumns = computed<NaiveUI.TableColumn<Api.SystemManage.Dict>[]>(() => [
  {
    key: 'code',
    title: $t('page.manage.dict.code'),
    minWidth: 160,
    ellipsis: { tooltip: true }
  },
  {
    key: 'name',
    title: $t('page.manage.dict.name'),
    minWidth: 160,
    ellipsis: { tooltip: true }
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
    ellipsis: { tooltip: true }
  }
]);

/** the list takes the columns as a factory, they follow the locale */
function getDictColumns() {
  return dictColumns.value;
}

const dictListRef = ref<ManageListInstance<Api.SystemManage.Dict> | null>(null);

/** rows currently loaded in the dictionary list */
const dictRows = computed(() => dictListRef.value?.data ?? []);

/** ---------------- dict entry list ---------------- */

/** selected dictionary (from the dict list), used to filter the entries list */
const activeDictId = ref('');
const activeDictName = ref('');

/** the entries panel title, it follows the selected dictionary */
const entryTitle = computed(() =>
  activeDictId.value
    ? `${$t('page.manage.dict.entry.title')} · ${activeDictName.value}`
    : $t('page.manage.dict.entry.title')
);

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
  { prop: 'val4', label: $t('page.manage.dict.entry.val4'), fast: true },
  // same state filter as the dictionary list
  {
    prop: 'state',
    label: $t('page.manage.dict.stateLabel'),
    valueType: 'select',
    types: ['eq', 'ne'],
    options: translateOptions(enableStateOptions)
  }
]);

const entryButtonRules: PageButtonStateRules<Api.SystemManage.DictEntry> = {
  enable: ({ rows }) => rows.every(row => isEnabled(row.stateEnum)),
  disable: ({ rows }) => rows.every(row => !isEnabled(row.stateEnum)),
  update: ({ rows }) => rows.length !== 1,
  edit: ({ rows }) => rows.length !== 1,
  // creating an entry needs a selected dictionary
  create: () => !activeDictId.value,
  add: () => !activeDictId.value
};

/** the entries list is tied to the selected dictionary, never search it without one */
function canSearchEntries() {
  if (activeDictId.value) return true;

  window.$message?.warning($t('page.manage.dict.selectDict'));

  return false;
}

/** the entries of the dictionary selected on the left */
function entryExtraItems(): Api.SystemManage.QueryItem[] {
  return activeDictId.value ? [{ prop: 'pid', values: [activeDictId.value], type: 'eq' }] : [];
}

/** Data columns of the entries list; the operate column is added by the list */
const entryColumns = computed<NaiveUI.TableColumn<Api.SystemManage.DictEntry>[]>(() => [
  {
    key: 'code',
    title: $t('page.manage.dict.entry.code'),
    minWidth: 140,
    ellipsis: { tooltip: true }
  },
  {
    key: 'val',
    title: $t('page.manage.dict.entry.val'),
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'val2',
    title: $t('page.manage.dict.entry.val2'),
    minWidth: 110,
    ellipsis: { tooltip: true }
  },
  {
    key: 'val3',
    title: $t('page.manage.dict.entry.val3'),
    minWidth: 110,
    ellipsis: { tooltip: true }
  },
  {
    key: 'val4',
    title: $t('page.manage.dict.entry.val4'),
    minWidth: 110,
    ellipsis: { tooltip: true }
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
    ellipsis: { tooltip: true }
  }
]);

/** the list takes the columns as a factory, they follow the locale */
function getEntryColumns() {
  return entryColumns.value;
}

const entryListRef = ref<ManageListInstance<Api.SystemManage.DictEntry> | null>(null);

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
        await dictListRef.value?.getData();
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
        await entryListRef.value?.getData();
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

/** select a dictionary and refresh the linked entries list */
async function selectDict(row: Api.SystemManage.Dict) {
  activeDictId.value = row.id;
  activeDictName.value = row.name;

  await entryListRef.value?.reload();
}

/** clear the link when the selected dictionary is no longer in the list */
watch(dictRows, rows => {
  if (!rows.some(row => row.id === activeDictId.value)) {
    activeDictId.value = '';
    activeDictName.value = '';
  }
});

async function handleDictSubmitted() {
  closeDictModal();
  // only the list has to be refreshed here: the entry form select reloads when that form opens
  await dictListRef.value?.getData();

  // if a dictionary is selected on the right, reload its entries once (the change may affect them)
  if (activeDictId.value) {
    await entryListRef.value?.getData();
  }
}

async function handleEntrySubmitted() {
  closeEntryModal();
  await entryListRef.value?.getData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 gap-16px overflow-hidden">
    <ManageList
      ref="dictListRef"
      table-key="manage_dict"
      :title="$t('route.manage_dict')"
      class="min-w-0 min-h-0 flex-[5]"
      :api="fetchDictSearch"
      :fields="dictSearchFields"
      :columns="getDictColumns"
      :button-rules="dictButtonRules"
      :row-class-name="dictRowClassName"
      :row-props="dictRowProps"
      :row-action="handleDictRowAction"
      @toolbar-action="handleDictToolbarAction"
    />
    <ManageList
      ref="entryListRef"
      table-key="manage_dict_entry"
      :title="entryTitle"
      class="min-w-0 min-h-0 flex-[5]"
      :api="fetchDictEntrySearch"
      :immediate="false"
      :extra-items="entryExtraItems"
      :before-search="canSearchEntries"
      :pagination-disabled="!activeDictId"
      :buttons="leftTopButtons"
      :operate-buttons="leftRowButtons"
      :fields="entrySearchFields"
      :columns="getEntryColumns"
      :button-rules="entryButtonRules"
      :row-action="handleEntryRowAction"
      @toolbar-action="handleEntryToolbarAction"
    />
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
