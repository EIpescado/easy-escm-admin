<script setup lang="ts" generic="Row extends Record<string, any>">
import { computed, h, shallowRef, watch } from 'vue';
import type { FlatResponseData } from '@sa/axios';
import {
  BUTTON_POSITION,
  getButtonLabel,
  resolvePageButtonDisabled,
  usePageButtons,
  type PageButtonStateRules
} from '@/hooks/business/page-buttons';
import { useManageTable } from '@/hooks/business/manage-table';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import QueryFilter from './query-filter/index.vue';
import TableExportButton from './table-export-button.vue';
import TableRowOperation from './table-row-operation.vue';
import TableToolbarButtons from './table-toolbar-buttons.vue';
import type { QueryField } from './query-filter/types';

defineOptions({
  name: 'ManageList'
});

/** flat response of a paginated search, the `request` helper unwraps the backend envelope */
type PageResponse = FlatResponseData<unknown, Api.SystemManage.PageResult<Row>>;

/**
 * A complete management list
 *
 * A page only declares the query fields and the data columns; the query filter, the card, the
 * toolbar buttons, the export, the column settings, the refresh, the sort and the pagination are
 * all provided here, so every list looks and behaves the same.
 */
interface Props {
  /** unique key persisting the column checks and the sort of this list */
  tableKey: string;
  /** backend search api, called with the assembled `PageQo` */
  api: (params: Api.SystemManage.PageQo) => Promise<PageResponse>;
  /** fields rendered by the query filter */
  fields: QueryField[];
  /** data columns; the operate and selection columns are added by the component */
  columns: () => NaiveUI.TableColumn<Row>[];
  /** card title, e.g. the route name */
  title?: string;
  /** whether the list offers a custom sort, shown next to the pagination */
  sortable?: boolean;
  /** conditions always applied besides the filter, e.g. a fixed parent id */
  extraItems?: () => Api.SystemManage.QueryItem[];
  /** whether to fetch on creation */
  immediate?: boolean;
  /** export api; the visible columns are appended to the params (the api adds `export: true`) */
  exportApi?: (params: Api.SystemManage.PageQo) => Promise<FlatResponseData<any, Blob>>;
  /** prepend a selection column */
  selection?: boolean;
  /** row key of the table, defaults to the `id` field */
  rowKey?: (row: Row) => string | number;
  /** extra props of a table row, e.g. a click handler */
  rowProps?: (row: Row) => Record<string, unknown> | undefined;
  /** class name of a table row */
  rowClassName?: (row: Row) => string;
  /**
   * Handler of the operate column
   *
   * When given, the component prepends an operate column built from the `row` buttons of the
   * current route and dispatches their `click` to it.
   */
  rowAction?: (row: Row, click: string) => void;
  /** toolbar buttons, defaults to the `top` buttons of the current route */
  buttons?: Api.SystemManage.ButtonNode[];
  /** buttons of the operate column, defaults to the `row` buttons of the current route */
  operateButtons?: Api.SystemManage.ButtonNode[];
  /** rules deciding whether a toolbar / row button is disabled */
  buttonRules?: PageButtonStateRules<Row>;
  /**
   * `click` codes rendered as a danger action in the operate column
   *
   * @default ['disable', 'delete']
   */
  dangerClicks?: string[];
  /**
   * Called before a search runs, return `false` to skip it
   *
   * Use it when the list cannot be searched yet, e.g. its parent row is not selected.
   */
  beforeSearch?: () => boolean;
  /** disable the pagination, e.g. while the list cannot be searched yet */
  paginationDisabled?: boolean;
}

/**
 * Vue casts an absent boolean prop to `false`, so every optional prop is given its default here;
 * `immediate` is the one whose semantic default is `true`
 */
const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  sortable: false,
  extraItems: undefined,
  immediate: true,
  exportApi: undefined,
  selection: false,
  rowKey: undefined,
  rowProps: undefined,
  rowClassName: undefined,
  rowAction: undefined,
  buttons: undefined,
  operateButtons: undefined,
  buttonRules: undefined,
  dangerClicks: () => ['disable', 'delete'],
  beforeSearch: undefined,
  paginationDisabled: false
});

interface Emits {
  /** a toolbar button was clicked, dispatch it by its `click` code */
  (e: 'toolbarAction', button: Api.SystemManage.ButtonNode): void;
}

const emit = defineEmits<Emits>();

const { toolbarButtons: routeButtons, rowButtons } = usePageButtons();

/** toolbar buttons of this list */
const buttons = computed(() => props.buttons ?? routeButtons.value);

/** buttons driving the operate column */
const operateButtons = computed(() => props.operateButtons ?? rowButtons.value);

const dangerClicks = computed(() => props.dangerClicks);

/** checked rows, the toolbar button rules act on the current selection */
const checkedRowKeys = shallowRef<(string | number)[]>([]);

function getRowKey(row: Row) {
  return props.rowKey ? props.rowKey(row) : String(row.id);
}

function isRowButtonDisabled(button: Api.SystemManage.ButtonNode, row: Row) {
  return resolvePageButtonDisabled(button.click, [row], BUTTON_POSITION.row, props.buttonRules);
}

/** operate column built from the `row` buttons of the current route */
const operateColumn = computed<NaiveUI.TableColumn<Row> | null>(() => {
  if (!props.rowAction || !operateButtons.value.length) return null;

  return {
    key: 'operate',
    title: $t('common.operate'),
    align: 'center',
    width: getTableOperateColumnWidth(operateButtons.value.map(button => getButtonLabel(button))),
    render: (row: Row) =>
      h(TableRowOperation, {
        options: operateButtons.value.map(button => ({
          key: button.click ?? button.name,
          label: getButtonLabel(button),
          danger: dangerClicks.value.includes(button.click ?? ''),
          disabled: isRowButtonDisabled(button, row),
          icon: button.icon || undefined
        })),
        onSelect: (key: string) => props.rowAction?.(row, key)
      })
  };
});

const {
  conditions,
  columns,
  columnChecks,
  data,
  loading,
  getData,
  scrollX,
  tablePagination,
  exportItems,
  params,
  handleSearch,
  handleReset,
  buildItems,
  reloadColumns
} = useManageTable<Row>({
  tableKey: props.tableKey,
  api: props.api,
  sortable: props.sortable,
  immediate: props.immediate,
  extraItems: props.extraItems,
  columns: () => {
    const tableColumns: NaiveUI.TableColumn<Row>[] = [];

    if (operateColumn.value) tableColumns.push(operateColumn.value);
    if (props.selection) tableColumns.push({ type: 'selection', align: 'center', width: 48 });

    tableColumns.push(...props.columns());

    return tableColumns;
  }
});

/** rows checked in the table, the toolbar button rules act on them */
const selectedRows = computed(() => data.value.filter(row => checkedRowKeys.value.includes(getRowKey(row))));

/** whether a toolbar button is disabled by its rules and the current selection */
function isToolbarButtonDisabled(button: Api.SystemManage.ButtonNode) {
  return resolvePageButtonDisabled(button.click, selectedRows.value, BUTTON_POSITION.top, props.buttonRules);
}

// the route `row` buttons drive the operate column: they may arrive after the first render, so the
// checks are rebuilt, then the operate column is kept visible and leftmost
watch(
  operateButtons,
  () => {
    reloadColumns();

    const index = columnChecks.value.findIndex(check => check.key === 'operate');

    if (index < 0) return;

    const [operateCheck] = columnChecks.value.splice(index, 1);

    operateCheck.checked = operateButtons.value.length > 0;
    columnChecks.value.unshift(operateCheck);
  },
  { immediate: true }
);

/** toolbar select: the backend `search` button runs the same search as the filter */
function handleToolbarSelect(button: Api.SystemManage.ButtonNode) {
  if (button.click === 'search') {
    search();

    return;
  }

  emit('toolbarAction', button);
}

/** run the search, unless the page vetoes it (e.g. its parent row is not selected yet) */
function search() {
  if (props.beforeSearch && !props.beforeSearch()) return;

  handleSearch();
}

/** rebuild the conditions and load the first page, e.g. after the fixed parent id changed */
async function reload() {
  params.items = buildItems();
  params.page = 1;

  await getData();
}

/** export the visible columns through the page export api */
function handleExport(): Promise<FlatResponseData<any, Blob>> {
  const api = props.exportApi;

  if (!api) return Promise.reject(new Error('no export api'));

  return api({ ...params, exportItems: exportItems.value });
}

/**
 * naive-ui types the data table props with `any`, so the generic `Row` is widened for them here
 * instead of leaking the cast into every page
 */
const tableColumns = computed(() => columns.value as unknown as any[]);
const tableRowProps = computed(() => props.rowProps as unknown as ((row: any) => any) | undefined);

/** the pagination, disabled while the list cannot be searched (e.g. its parent row is not selected) */
const tablePaginationProps = computed(() => ({ ...tablePagination.value, disabled: props.paginationDisabled }));

defineExpose({
  getData,
  reload,
  search,
  handleReset,
  data,
  loading
});
</script>

<template>
  <div class="min-h-0 flex flex-col gap-16px">
    <!-- the filter is its own card, so the eye sees two panels: filter / (buttons + list) -->
    <QueryFilter v-model="conditions" :fields="fields" class="shrink-0" @search="search" @reset="handleReset" />
    <NCard :bordered="false" size="small" class="manage-list-card min-h-0 flex-1" :title="title">
      <div class="h-full min-h-0 flex flex-col gap-16px">
        <div class="shrink-0">
          <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @refresh="getData">
            <template #default>
              <TableToolbarButtons
                :buttons="buttons"
                :disabled="isToolbarButtonDisabled"
                @select="handleToolbarSelect"
              />
            </template>
            <template v-if="exportApi" #export>
              <TableExportButton :api="handleExport" />
            </template>
          </TableHeaderOperation>
        </div>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="tableColumns"
          :data="data"
          :loading="loading"
          :row-key="getRowKey"
          :row-props="tableRowProps"
          :row-class-name="rowClassName"
          :pagination="tablePaginationProps"
          :paginate-single-page="true"
          :scroll-x="scrollX"
          remote
          flex-height
          class="min-h-0 flex-1"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
/* let the filter + table fill and scroll inside the card; naive-ui renders `.n-card-content` */
.manage-list-card :deep(.n-card-content) {
  min-height: 0;
}

/* uniform row height across the management lists */
.manage-list-card :deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
