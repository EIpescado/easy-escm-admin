<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { getButtonLabel, usePageButtons } from '@/hooks/business/page-buttons';
import {
  fetchResetUserPassword,
  fetchToggleUserState,
  fetchUserDetail,
  fetchUserExport,
  fetchUserList
} from '@/service/api';
import { userStateOptions, userStateRecord } from '@/constants/business';
import { translateOptions } from '@/utils/common';
import { getExportItems, getTableOperateColumnWidth } from '@/utils/table';
import { getTableSetting, setTableSetting } from '@/utils/table-settings';
import { $t } from '@/locales';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import TableExportButton from '@/components/advanced/table-export-button.vue';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import QuerySortButton from '@/components/advanced/query-filter/query-sort-button.vue';
import {
  createSortId,
  toOrderItems,
  toQueryItems,
  type QueryField,
  type QueryFilterCondition,
  type QuerySortItem
} from '@/components/advanced/query-filter/types';
import UserOperateModal from './modules/user-operate-modal.vue';

defineOptions({
  name: 'ManageUser'
});

const searchFields = computed<QueryField[]>(() => [
  { prop: 'username', label: $t('page.manage.user.username'), valueType: 'text', defaultType: 'like', types: ['like'] },
  { prop: 'nickname', label: $t('page.manage.user.nickname'), valueType: 'text', defaultType: 'like', types: ['like'] },
  { prop: 'phone', label: $t('page.manage.user.phone'), valueType: 'text', defaultType: 'eq', types: ['eq', 'like'] },
  { prop: 'mail', label: $t('page.manage.user.mail'), valueType: 'text', defaultType: 'like' },
  {
    prop: 'registerTime',
    label: $t('page.manage.user.registerTime'),
    valueType: 'date',
    defaultType: 'between',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'state',
    label: $t('page.manage.user.stateLabel'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq'],
    options: translateOptions(userStateOptions)
  }
]);

const searchConditions = ref<QueryFilterCondition[]>([]);

/** Unique key to persist the table settings (columns & sort) */
const TABLE_KEY = 'manage_user';

/** Restore the persisted sort, then keep it in sync */
const searchSort = ref<QuerySortItem[]>(
  (getTableSetting(TABLE_KEY)?.orders ?? []).map(order => ({
    id: createSortId(),
    prop: order.prop,
    asc: order.asc ?? true
  }))
);

watch(searchSort, items => setTableSetting(TABLE_KEY, { orders: toOrderItems(items) }), { deep: true });

const params = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: [],
  orders: toOrderItems(searchSort.value)
});

/** Buttons of the current route, provided by the backend menu tree */
const { toolbarButtons, rowButtons } = usePageButtons();

/** Toolbar buttons (position `top`), text comes from the backend button `name` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { add: handleAdd, search: handleSearch };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Row action buttons (position `row`), text comes from the backend button `name` */
function getOperateOptions(_row: Api.SystemManage.User) {
  return rowButtons.value.map(button => ({
    key: button.click ?? button.name,
    label: getButtonLabel(button),
    danger: button.click === 'disable',
    icon: button.icon || undefined
  }));
}

const operateColumnWidth = computed(() =>
  getTableOperateColumnWidth(rowButtons.value.map(button => getButtonLabel(button)))
);

const { columns, columnChecks, data, loading, getData, getDataByPage, mobilePagination } = useNaivePaginatedTable({
  tableKey: TABLE_KEY,
  api: () => fetchUserList({ page: params.page, size: params.size, items: params.items, orders: params.orders }),
  transform: response => {
    const { data: resData, error } = response;

    if (!error) {
      const { rows, page, size, total } = resData;

      return { data: rows || [], pageNum: page, pageSize: size, total };
    }

    return { data: [], pageNum: 1, pageSize: 10, total: 0 };
  },
  columns: () => {
    const tableColumns: NaiveUI.TableColumn<Api.SystemManage.User>[] = [];

    // hide the operate column when the route has no row buttons
    if (rowButtons.value.length) {
      tableColumns.push({
        key: 'operate',
        title: $t('common.operate'),
        align: 'center',
        width: operateColumnWidth.value,
        render: (row: Api.SystemManage.User) =>
          h(TableRowOperation, {
            options: getOperateOptions(row),
            onSelect: (key: string) => handleRowAction(row, key)
          })
      });
    }

    tableColumns.push(
      { type: 'selection', align: 'center', width: 48 },
      { key: 'username', title: $t('page.manage.user.username'), align: 'center', minWidth: 100 },
      { key: 'nickname', title: $t('page.manage.user.nickname'), align: 'center', minWidth: 100 },
      { key: 'phone', title: $t('page.manage.user.phone'), align: 'center', minWidth: 120 },
      { key: 'mail', title: $t('page.manage.user.mail'), align: 'center', minWidth: 160 },
      {
        key: 'state',
        title: $t('page.manage.user.stateLabel'),
        align: 'center',
        width: 100,
        render: row => {
          const type = row.stateEnum === 'NORMAL' ? 'success' : row.stateEnum === 'FORBIDDEN' ? 'error' : 'warning';

          return h(
            NTag,
            { type, size: 'small', bordered: false },
            { default: () => $t(userStateRecord[row.stateEnum]) }
          );
        }
      },
      { key: 'registerTime', title: $t('page.manage.user.registerTime'), align: 'center', minWidth: 170 },
      { key: 'lastLoginTime', title: $t('page.manage.user.lastLoginTime'), align: 'center', minWidth: 170 }
    );

    return tableColumns;
  },
  onPaginationParamsChange: paginationParams => {
    params.page = paginationParams.page ?? 1;
    params.size = paginationParams.pageSize ?? 10;
  }
});

// the operate column is driven by the backend row buttons; keep it visible and leftmost
watch(
  rowButtons,
  () => {
    const index = columnChecks.value.findIndex(check => check.key === 'operate');

    if (index < 0) return;

    const [operateCheck] = columnChecks.value.splice(index, 1);

    operateCheck.checked = rowButtons.value.length > 0;
    columnChecks.value.unshift(operateCheck);
  },
  { immediate: true }
);

/** Pagination with the sort button rendered on its right (via the pagination `suffix`) */
const tablePagination = computed(() => ({
  ...mobilePagination.value,
  suffix: () =>
    h(QuerySortButton, {
      modelValue: searchSort.value,
      'onUpdate:modelValue': (value: QuerySortItem[]) => {
        searchSort.value = value;
      },
      fields: searchFields.value,
      onConfirm: handleSearch
    })
}));

/** Export items follow the current column settings (checked columns, in table order) */
const exportItems = computed(() => getExportItems(columnChecks.value));

const { drawerVisible, openDrawer, closeDrawer, operateType, editingData, checkedRowKeys } = useTableOperate(
  data,
  'id',
  getData
);

const editRow = computed(() => editingData.value as unknown as Api.SystemManage.UserForm | null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = {
    id: undefined,
    username: '',
    nickname: '',
    phone: '',
    mail: '',
    roleIds: []
  } as unknown as Api.SystemManage.User;

  openDrawer();
}

async function handleEditUser(id: string) {
  operateType.value = 'edit';
  const { data: detail, error } = await fetchUserDetail(id);

  if (!error) {
    editingData.value = detail as unknown as Api.SystemManage.User;
    openDrawer();
  }
}

function handleSearch() {
  params.items = toQueryItems(searchConditions.value);
  params.orders = toOrderItems(searchSort.value);
  params.page = 1;

  getDataByPage(1);
}

/** Reset only restores the query conditions to default, keeping the custom sort, without sending a request */
function handleReset() {
  params.items = [];
  params.page = 1;
}

async function handleResetPassword(id: string) {
  window.$dialog?.warning({
    title: $t('common.tip'),
    content: $t('page.manage.user.resetPasswordConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchResetUserPassword(id);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
      }
    }
  });
}

function handleSetState(row: Api.SystemManage.User, enable: boolean) {
  window.$dialog?.warning({
    title: $t('common.tip'),
    content: $t(enable ? 'page.manage.user.enableConfirm' : 'page.manage.user.disableConfirm', { name: row.username }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchToggleUserState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await getData();
      }
    }
  });
}

/** Row action handlers, dispatched by the backend button `click` */
const rowActionHandlers: Record<string, (row: Api.SystemManage.User) => void> = {
  update: row => handleEditUser(row.id),
  resetPassword: row => handleResetPassword(row.id),
  enable: row => handleSetState(row, true),
  disable: row => handleSetState(row, false)
};

function handleRowAction(row: Api.SystemManage.User, key: string) {
  const handler = rowActionHandlers[key];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

async function handleSubmitted() {
  closeDrawer();
  await getData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <QueryFilter
      v-model="searchConditions"
      :fields="searchFields"
      class="shrink-0"
      @search="handleSearch"
      @reset="handleReset"
    />
    <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
      <template #header>
        <TableHeaderOperation v-model:columns="columnChecks" :loading="loading" @add="handleAdd" @refresh="getData">
          <template #default>
            <NButton
              v-for="button in toolbarButtons"
              :key="button.id"
              size="small"
              ghost
              type="primary"
              @click="handleToolbarAction(button)"
            >
              <template v-if="button.icon" #icon>
                <SvgIcon :icon="button.icon" />
              </template>
              {{ getButtonLabel(button) }}
            </NButton>
          </template>
          <template #export>
            <TableExportButton :api="() => fetchUserExport({ ...params, exportItems })" />
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="row => row.id"
        :pagination="tablePagination"
        :paginate-single-page="true"
        :scroll-x="900"
        remote
        flex-height
        class="h-full"
      />
    </NCard>
    <UserOperateModal
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row="editRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
