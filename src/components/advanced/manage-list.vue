<script setup lang="ts" generic="Row extends Record<string, any>">
import { computed, h, watch } from 'vue';
import type { FlatResponseData } from '@sa/axios';
import {
  getButtonLabel,
  resolvePageButtonDisabled,
  usePageButtons,
  type PageButtonPosition,
  type PageButtonStateRules
} from '@/hooks/business/page-buttons';
import { useManageTable } from '@/hooks/business/manage-table';
import { fetchPageExport, fetchPageSearch } from '@/service/api';
import { getTableOperateColumnWidth, withCellRenderer, type ManageColumn } from '@/utils/table';
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
  /**
   * Backend search url
   *
   * Every `/system/**` list shares the same `PageQo` → `PageResult` shape, so the component builds
   * the request itself and the page only declares the endpoint.
   */
  url: string;
  /** fields rendered by the query filter */
  fields: QueryField[];
  /** data columns; the operate and selection columns are added by the component */
  columns: () => ManageColumn<Row>[];
  /**
   * Card title
   *
   * Empty unless a page declares one, and only the pages that need it (e.g. two lists side by side,
   * like the dictionary page) should pass it; a single list leaves it unset.
   */
  title?: string;
  /**
   * Replaces the built-in `no data` hint of the list area
   *
   * Use it to flag a state instead of an empty list, e.g. "all dictionaries bound".
   */
  emptyText?: string;
  /** Iconify name of the {@link Props.emptyText} icon */
  emptyIcon?: string;
  /** whether the list offers a custom sort, shown next to the pagination */
  sortable?: boolean;
  /** conditions always applied besides the filter, e.g. a fixed parent id */
  extraItems?: () => Api.SystemManage.QueryItem[];
  /**
   * Top level params always sent with the request, e.g. the `userId` of the selected parent row
   *
   * Unlike `extraItems` these are not `items` conditions but fields of the `PageQo` itself.
   */
  extraParams?: () => Record<string, unknown>;
  /** whether to fetch on creation */
  immediate?: boolean;
  /**
   * Whether the list offers an export
   *
   * It posts the same `url` with `export: true` and the visible columns as `exportItems`, and the
   * backend answers with an xlsx stream.
   *
   * @default false
   */
  exportable?: boolean;
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
  /** toolbar buttons, defaults to the route buttons of `topButtonPosition` */
  buttons?: Api.SystemManage.ButtonNode[];
  /**
   * `position` group of the route buttons rendered in the toolbar
   *
   * A page that puts several lists side by side configures it per list, e.g. `left-top`.
   *
   * @default 'top'
   */
  topButtonPosition?: PageButtonPosition;
  /** buttons of the operate column, defaults to the route buttons of `rowButtonPosition` */
  operateButtons?: Api.SystemManage.ButtonNode[];
  /**
   * `position` group of the route buttons rendered as the operate column
   *
   * @default 'row'
   */
  rowButtonPosition?: PageButtonPosition;
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
  emptyText: undefined,
  emptyIcon: undefined,
  sortable: false,
  extraItems: undefined,
  extraParams: undefined,
  immediate: true,
  exportable: false,
  selection: false,
  rowKey: undefined,
  rowProps: undefined,
  rowClassName: undefined,
  rowAction: undefined,
  buttons: undefined,
  topButtonPosition: 'top',
  operateButtons: undefined,
  rowButtonPosition: 'row',
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

const { buttons: routeButtons } = usePageButtons();

/** toolbar buttons of this list, the configured `position` group of the route buttons */
const routeToolbarButtons = computed(() => routeButtons.value[props.topButtonPosition] ?? []);

/** buttons driving the operate column, the configured `position` group of the route buttons */
const routeRowButtons = computed(() => routeButtons.value[props.rowButtonPosition] ?? []);

/** toolbar buttons of this list */
const buttons = computed(() => props.buttons ?? routeToolbarButtons.value);

/** buttons driving the operate column */
const operateButtons = computed(() => props.operateButtons ?? routeRowButtons.value);

const dangerClicks = computed(() => props.dangerClicks);

/** checked rows, the toolbar button rules act on the current selection */
/** checked rows, the toolbar button rules act on the current selection; a page can pre-check rows */
const checkedRowKeys = defineModel<(string | number)[]>('checkedRowKeys', { default: () => [] });

function getRowKey(row: Row) {
  return props.rowKey ? props.rowKey(row) : String(row.id);
}

function isRowButtonDisabled(button: Api.SystemManage.ButtonNode, row: Row) {
  return resolvePageButtonDisabled(button.click, [row], props.rowButtonPosition, props.buttonRules);
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
  buildParams,
  reloadColumns
} = useManageTable<Row>({
  tableKey: props.tableKey,
  // every `/system/**` list shares the same request shape, only the url differs
  api: (query: Api.SystemManage.PageQo): Promise<PageResponse> =>
    fetchPageSearch<Row>(props.url, { ...query, ...props.extraParams?.() }),
  sortable: props.sortable,
  immediate: props.immediate,
  fields: () => props.fields,
  extraItems: props.extraItems,
  columns: () => {
    const tableColumns: NaiveUI.TableColumn<Row>[] = [];

    if (operateColumn.value) tableColumns.push(operateColumn.value);
    if (props.selection) tableColumns.push({ type: 'selection', align: 'center', width: 48 });

    // the pages may mark a column with a built-in `cell` renderer instead of writing one
    tableColumns.push(...props.columns().map(column => withCellRenderer(column)));

    return tableColumns;
  }
});

/** rows checked in the table, the toolbar button rules act on them */
const selectedRows = computed(() => data.value.filter(row => checkedRowKeys.value.includes(getRowKey(row))));

/** whether a toolbar button is disabled by its rules and the current selection */
function isToolbarButtonDisabled(button: Api.SystemManage.ButtonNode) {
  return resolvePageButtonDisabled(button.click, selectedRows.value, props.topButtonPosition, props.buttonRules);
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

/** export the visible columns of this list as an xlsx stream */
function handleExport() {
  return fetchPageExport(props.url, {
    ...params,
    ...buildParams(),
    ...props.extraParams?.(),
    exportItems: exportItems.value
  });
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
  loading,
  /** rows checked in the table, e.g. for a toolbar action acting on the selection */
  selectedRows,
  checkedRowKeys
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
            <template v-if="exportable" #export>
              <TableExportButton :api="handleExport" />
            </template>
          </TableHeaderOperation>
        </div>
        <!-- the page flags a state instead of showing a list, e.g. "all dictionaries bound" -->
        <div v-if="emptyText" class="min-h-0 flex flex-1 flex-col items-center justify-center gap-8px">
          <SvgIcon v-if="emptyIcon" :icon="emptyIcon" class="text-40px" />
          <span class="text-14px text-gray-400">{{ emptyText }}</span>
        </div>
        <NDataTable
          v-else
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
