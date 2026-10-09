import { computed, effectScope, onScopeDispose, reactive, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { useBoolean, useTable } from '@sa/hooks';
import type { PaginationData, TableColumnCheck, UseTableOptions } from '@sa/hooks';
import type { FlatResponseData } from '@sa/axios';
import { jsonClone } from '@sa/utils';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import { getTableSetting, setTableSetting } from '@/utils/table-settings';

export type UseNaiveTableOptions<ResponseData, ApiData, Pagination extends boolean> = Omit<
  UseTableOptions<ResponseData, ApiData, NaiveUI.TableColumn<ApiData>, Pagination>,
  'pagination' | 'getColumnChecks' | 'getColumns'
> & {
  /**
   * get column visible
   *
   * @param column
   *
   * @default true
   *
   * @returns true if the column is visible, false otherwise
   */
  getColumnVisible?: (column: NaiveUI.TableColumn<ApiData>) => boolean;
  /**
   * unique table key used to persist table settings (column checks & sort) in the localStorage
   *
   * - if not provided, the settings are not persisted
   */
  tableKey?: string;
};

const SELECTION_KEY = '__selection__';

const EXPAND_KEY = '__expand__';

/**
 * Calculate the total width of the visible columns.
 *
 * Used as the `scroll-x` of the data table: when the total width exceeds the container width, the table shows a
 * horizontal scrollbar, otherwise the columns stretch to fill the container.
 */
export function getTableScrollX<ApiData>(columns: NaiveUI.TableColumn<ApiData>[]) {
  return columns.reduce((acc, column) => {
    return acc + Number(column.width ?? column.minWidth ?? 120);
  }, 0);
}

/**
 * Restore and persist the column checks of a table
 *
 * The stored check state (`checked` / `fixed` / order) is merged onto the current default checks,
 * so newly added or removed columns still work.
 */
function bindColumnChecksStorage(columnChecks: Ref<TableColumnCheck[]>, tableKey?: string) {
  if (!tableKey) return;

  const stored = getTableSetting(tableKey)?.columns;

  if (stored?.length) {
    const current = columnChecks.value;
    const currentMap = new Map(current.map(check => [check.key, check]));

    const ordered = stored
      .map(item => {
        const check = currentMap.get(item.key);

        return check ? { ...check, checked: item.checked, fixed: item.fixed } : null;
      })
      .filter((check): check is TableColumnCheck => check !== null);

    const rest = current.filter(check => !stored.some(item => item.key === check.key));

    columnChecks.value = [...ordered, ...rest];
  }

  watch(
    columnChecks,
    checks => {
      setTableSetting(tableKey, {
        columns: checks.map(check => ({ key: check.key, checked: check.checked, fixed: check.fixed }))
      });
    },
    { deep: true }
  );
}

export function useNaiveTable<ResponseData, ApiData>(options: UseNaiveTableOptions<ResponseData, ApiData, false>) {
  const scope = effectScope();
  const appStore = useAppStore();

  const result = useTable<ResponseData, ApiData, NaiveUI.TableColumn<ApiData>, false>({
    ...options,
    delay: options.delay ?? 600,
    getColumnChecks: cols => getColumnChecks(cols, options.getColumnVisible),
    getColumns
  });

  // calculate the total width of the table this is used for horizontal scrolling
  const scrollX = computed(() => getTableScrollX(result.columns.value));

  scope.run(() => {
    bindColumnChecksStorage(result.columnChecks, options.tableKey);

    watch(
      () => appStore.locale,
      () => {
        result.reloadColumns();
      }
    );
  });

  onScopeDispose(() => {
    scope.stop();
  });

  return {
    ...result,
    scrollX
  };
}

type PaginationParams = Pick<PaginationProps, 'page' | 'pageSize'>;

type UseNaivePaginatedTableOptions<ResponseData, ApiData> = UseNaiveTableOptions<ResponseData, ApiData, true> & {
  paginationProps?: Omit<PaginationProps, 'page' | 'pageSize' | 'itemCount'>;
  /**
   * whether to show the total count of the table
   *
   * @default true
   */
  showTotal?: boolean;
  onPaginationParamsChange?: (params: PaginationParams) => void | Promise<void>;
};

export function useNaivePaginatedTable<ResponseData, ApiData>(
  options: UseNaivePaginatedTableOptions<ResponseData, ApiData>
) {
  const scope = effectScope();
  const appStore = useAppStore();

  const isMobile = computed(() => appStore.isMobile);

  const showTotal = computed(() => options.showTotal ?? true);

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    showSizePicker: true,
    pageSizes: [10, 15, 20, 25, 30],
    prefix: showTotal.value ? page => $t('datatable.itemCount', { total: page.itemCount }) : undefined,
    onUpdatePage(page) {
      pagination.page = page;
    },
    onUpdatePageSize(pageSize) {
      pagination.pageSize = pageSize;
      pagination.page = 1;
    },
    ...options.paginationProps
  }) as PaginationProps;

  // this is for mobile, if the system does not support mobile, you can use `pagination` directly
  const mobilePagination = computed(() => {
    const p: PaginationProps = {
      ...pagination,
      pageSlot: isMobile.value ? 3 : 9,
      prefix: !isMobile.value && showTotal.value ? pagination.prefix : undefined
    };

    return p;
  });

  const paginationParams = computed(() => {
    const { page, pageSize } = pagination;

    return {
      page,
      pageSize
    };
  });

  const result = useTable<ResponseData, ApiData, NaiveUI.TableColumn<ApiData>, true>({
    ...options,
    delay: options.delay ?? 600,
    pagination: true,
    getColumnChecks: cols => getColumnChecks(cols, options.getColumnVisible),
    getColumns,
    onFetched: data => {
      // Only sync the total. Do NOT assign `pageSize` from the response: that would mutate
      // `pagination`, trip the `paginationParams` watcher below and fire a duplicate request
      // (the backend may return `size` as a string, which is never strictly equal to a number).
      pagination.itemCount = Number(data.total) || 0;
    }
  });

  async function getDataByPage(page: number = 1) {
    if (page !== pagination.page) {
      pagination.page = page;

      return;
    }

    await result.getData();
  }

  // total width of the visible columns, drives the horizontal scrollbar of the table
  const scrollX = computed(() => getTableScrollX(result.columns.value));

  scope.run(() => {
    bindColumnChecksStorage(result.columnChecks, options.tableKey);

    watch(
      () => appStore.locale,
      () => {
        result.reloadColumns();
      }
    );

    watch(paginationParams, async newVal => {
      await options.onPaginationParamsChange?.(newVal);

      await result.getData();
    });
  });

  onScopeDispose(() => {
    scope.stop();
  });

  return {
    ...result,
    getDataByPage,
    pagination,
    mobilePagination,
    scrollX
  };
}

export function useTableOperate<TableData>(
  data: Ref<TableData[]>,
  idKey: keyof TableData,
  getData: () => Promise<void>
) {
  const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();

  const operateType = shallowRef<NaiveUI.TableOperateType>('add');

  function handleAdd() {
    operateType.value = 'add';
    openDrawer();
  }

  /** the editing row data */
  const editingData = shallowRef<TableData | null>(null);

  function handleEdit(id: TableData[keyof TableData]) {
    operateType.value = 'edit';
    const findItem = data.value.find(item => item[idKey] === id) || null;
    editingData.value = jsonClone(findItem);

    openDrawer();
  }

  /** the checked row keys of table */
  const checkedRowKeys = shallowRef<string[]>([]);

  /** the hook after the batch delete operation is completed */
  async function onBatchDeleted() {
    window.$message?.success($t('common.deleteSuccess'));

    checkedRowKeys.value = [];

    await getData();
  }

  /** the hook after the delete operation is completed */
  async function onDeleted() {
    window.$message?.success($t('common.deleteSuccess'));

    await getData();
  }

  return {
    drawerVisible,
    openDrawer,
    closeDrawer,
    operateType,
    handleAdd,
    editingData,
    handleEdit,
    checkedRowKeys,
    onBatchDeleted,
    onDeleted
  };
}

export function defaultTransform<ApiData>(
  response: FlatResponseData<any, Api.Common.PaginatingQueryRecord<ApiData>>
): PaginationData<ApiData> {
  const { data, error } = response;

  if (!error) {
    const { records, current, size, total } = data;

    return {
      data: records,
      pageNum: current,
      pageSize: size,
      total
    };
  }

  return {
    data: [],
    pageNum: 1,
    pageSize: 10,
    total: 0
  };
}

function getColumnChecks<Column extends NaiveUI.TableColumn<any>>(
  cols: Column[],
  getColumnVisible?: (column: Column) => boolean
) {
  const checks: TableColumnCheck[] = [];

  cols.forEach(column => {
    if (isTableColumnHasKey(column)) {
      checks.push({
        key: column.key as string,
        title: column.title!,
        checked: true,
        fixed: column.fixed ?? 'unFixed',
        visible: getColumnVisible?.(column) ?? true
      });
    } else if (column.type === 'selection') {
      checks.push({
        key: SELECTION_KEY,
        title: $t('common.check'),
        checked: true,
        fixed: column.fixed ?? 'unFixed',
        visible: getColumnVisible?.(column) ?? false
      });
    } else if (column.type === 'expand') {
      checks.push({
        key: EXPAND_KEY,
        title: $t('common.expandColumn'),
        checked: true,
        fixed: column.fixed ?? 'unFixed',
        visible: getColumnVisible?.(column) ?? false
      });
    }
  });

  return checks;
}

function getColumns<Column extends NaiveUI.TableColumn<any>>(cols: Column[], checks: TableColumnCheck[]) {
  const columnMap = new Map<string, Column>();

  cols.forEach(column => {
    if (isTableColumnHasKey(column)) {
      columnMap.set(column.key as string, column);
    } else if (column.type === 'selection') {
      columnMap.set(SELECTION_KEY, column);
    } else if (column.type === 'expand') {
      columnMap.set(EXPAND_KEY, column);
    }
  });

  const filteredColumns = checks
    .filter(item => item.checked)
    .map(check => {
      return {
        ...columnMap.get(check.key),
        fixed: check.fixed
      } as Column;
    });

  return filteredColumns;
}

export function isTableColumnHasKey<T>(column: NaiveUI.TableColumn<T>): column is NaiveUI.TableColumnWithKey<T> {
  return Boolean((column as NaiveUI.TableColumnWithKey<T>).key);
}
