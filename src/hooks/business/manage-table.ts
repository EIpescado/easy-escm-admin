import { computed, h, reactive, ref, watch } from 'vue';
import type { FlatResponseData } from '@sa/axios';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { getExportItems, getSortFields } from '@/utils/table';
import { getTableSetting, setTableSetting } from '@/utils/table-settings';
import QuerySortButton from '@/components/advanced/query-filter/query-sort-button.vue';
import {
  createCondition,
  createSortId,
  isConditionFilled,
  toOrderItems,
  toQueryItems,
  type QueryField,
  type QueryFilterCondition,
  type QuerySortItem
} from '@/components/advanced/query-filter/types';

/**
 * The management list: a query filter, an optional custom sort, front-end pagination and the backend
 * search call.
 *
 * Every `/system/**` list shares the same request and response shape (`PageQo` in, `PageResult<Row>`
 * out), so only the api, the columns and the extra conditions differ between pages.
 */

/** Flat response of a paginated search, the `request` helper unwraps the backend envelope */
type PageResponse<Row> = FlatResponseData<unknown, Api.SystemManage.PageResult<Row>>;

export interface UseManageTableOptions<Row extends Record<string, any>> {
  /** unique key persisting the column checks & sort in the localStorage */
  tableKey: string;
  /** backend search api, called with the assembled `PageQo` */
  api: (params: Api.SystemManage.PageQo) => Promise<PageResponse<Row>>;
  /** table columns factory */
  columns: () => NaiveUI.TableColumn<Row>[];
  /**
   * Fields of the query filter, used to seed the conditions that declare `defaultValues`
   *
   * @see QueryField.defaultValues
   */
  fields?: () => QueryField[];
  /** conditions always applied besides the filter, e.g. the fixed `pid` of a dictionary's entries */
  extraItems?: () => Api.SystemManage.QueryItem[];
  /**
   * whether to fetch on creation
   *
   * @default true
   */
  immediate?: boolean;
  /**
   * whether the list offers a custom sort, which follows the column settings
   *
   * @default false
   */
  sortable?: boolean;
  /**
   * Backend sort applied until the user changes the sort of a sortable list
   *
   * A non-sortable list keeps it for every search, e.g. the dictionary entries are ordered by `sn`.
   */
  defaultOrders?: Api.SystemManage.OrderByItem[];
}

export function useManageTable<Row extends Record<string, any>>(options: UseManageTableOptions<Row>) {
  const { tableKey, api, columns, fields, extraItems, immediate = true, sortable = false, defaultOrders } = options;

  /**
   * Filter conditions, seeded from the fields that declare `defaultValues` (e.g. a default date
   * range); the query filter keeps them and preserves their values.
   */
  const conditions = ref<QueryFilterCondition[]>(
    (fields?.() ?? [])
      .filter(field => field.defaultValues?.length)
      .map(field => createCondition(field, { values: field.defaultValues }))
  );

  /**
   * Sort rules: the saved ones of the column settings, otherwise the page defaults
   *
   * A non-sortable list never changes them, so its defaults apply to every search.
   */
  const sort = ref<QuerySortItem[]>(
    (getTableSetting(tableKey)?.orders ?? defaultOrders ?? []).map(order => ({
      id: createSortId(),
      prop: order.prop,
      asc: order.asc ?? true
    }))
  );

  watch(sort, items => setTableSetting(tableKey, { orders: toOrderItems(items) }), { deep: true });

  /** backend conditions: the filter plus the fixed ones of the page */
  function buildItems() {
    return [...toQueryItems(conditions.value), ...(extraItems?.() ?? [])];
  }

  /**
   * Top-level request params built from the `param` fields of the filter
   *
   * A `param` field (e.g. `showRequestContent`) is not a WHERE condition, so its value is merged
   * into the request body instead of `items`.
   */
  function buildParams() {
    const result: Record<string, string> = {};

    conditions.value.forEach(condition => {
      if (condition.param && isConditionFilled(condition)) {
        result[condition.prop] = condition.values[0];
      }
    });

    return result;
  }

  const params = reactive<Api.SystemManage.PageQo>({
    page: 1,
    size: 10,
    // the seeded default conditions must be part of the first search
    items: buildItems(),
    orders: toOrderItems(sort.value)
  });

  const table = useNaivePaginatedTable<PageResponse<Row>, Row>({
    tableKey,
    immediate,
    api: () => api(Object.assign({}, params, buildParams())),
    transform: response => {
      const { data: resData, error } = response;

      if (!error) {
        const { rows, page, size, total } = resData;

        return { data: rows || [], pageNum: page, pageSize: size, total };
      }

      return { data: [], pageNum: 1, pageSize: 10, total: 0 };
    },
    columns,
    onPaginationParamsChange: paginationParams => {
      params.page = paginationParams.page ?? 1;
      params.size = paginationParams.pageSize ?? 10;
    }
  });

  /** sortable fields follow the column settings */
  const sortFields = computed<QueryField[]>(() => getSortFields(table.columnChecks.value));

  /** export items follow the column settings */
  const exportItems = computed(() => getExportItems(table.columnChecks.value));

  /** pagination with the sort button rendered on its right, when the list is sortable */
  const tablePagination = computed(() => {
    const pagination = table.mobilePagination.value;

    if (!sortable) return pagination;

    return {
      ...pagination,
      suffix: () =>
        h(QuerySortButton, {
          modelValue: sort.value,
          'onUpdate:modelValue': (value: QuerySortItem[]) => {
            sort.value = value;
          },
          fields: sortFields.value,
          onConfirm: handleSearch
        })
    };
  });

  function handleSearch() {
    params.items = buildItems();

    if (sortable) params.orders = toOrderItems(sort.value);

    params.page = 1;

    table.getDataByPage(1);
  }

  /** reset only clears the conditions, keeping the custom sort, without sending a request */
  function handleReset() {
    // the fixed conditions (e.g. the parent id of a linked list) must survive a reset
    params.items = buildItems();
    params.page = 1;
  }

  return {
    ...table,
    /** filter conditions, bind them to `QueryFilter` */
    conditions,
    /** sort rules, only used when `sortable` */
    sort,
    /** sortable fields, only used when `sortable` */
    sortFields,
    /** pagination to pass to the table, it carries the sort button when `sortable` */
    tablePagination,
    /** export items following the column settings */
    exportItems,
    /** backend params, e.g. to build an export request from them */
    params,
    /** assemble the backend conditions, `items` plus the fixed ones */
    buildItems,
    /** assemble the top-level request params from the `param` fields */
    buildParams,
    handleSearch,
    handleReset
  };
}
