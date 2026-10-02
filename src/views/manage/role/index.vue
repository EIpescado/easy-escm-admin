<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { fetchRoleList } from '@/service/api';
import { roleStateOptions, roleStateRecord } from '@/constants/business';
import { translateOptions } from '@/utils/common';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import { toQueryItems, type QueryField, type QueryFilterCondition } from '@/components/advanced/query-filter/types';
import RoleOperateModal from './modules/role-operate-modal.vue';
import MenuAuthModal from './modules/menu-auth-modal.vue';

defineOptions({
  name: 'ManageRole'
});

const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'roleCode',
    label: $t('page.manage.role.roleCode'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like']
  },
  {
    prop: 'roleName',
    label: $t('page.manage.role.roleName'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like']
  },
  {
    prop: 'state',
    label: $t('page.manage.role.stateLabel'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq'],
    options: translateOptions(roleStateOptions)
  }
]);

const searchConditions = ref<QueryFilterCondition[]>([]);

const params = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: []
});

function getOperateOptions(_row: Api.SystemManage.Role) {
  return [
    { key: 'edit', label: $t('common.edit') },
    { key: 'menuAuth', label: $t('page.manage.role.menuAuth') }
  ];
}

const operateColumnWidth = computed(() =>
  getTableOperateColumnWidth([$t('common.edit'), $t('page.manage.role.menuAuth')])
);

const { columns, columnChecks, data, loading, getData, getDataByPage, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchRoleList({ page: params.page, size: params.size, items: params.items }),
  transform: response => {
    const { data: resData, error } = response;

    if (!error) {
      const { rows, page, size, total } = resData;

      return { data: rows || [], pageNum: page, pageSize: size, total };
    }

    return { data: [], pageNum: 1, pageSize: 10, total: 0 };
  },
  columns: () => [
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: operateColumnWidth.value,
      render: (row: Api.SystemManage.Role) =>
        h(TableRowOperation, {
          options: getOperateOptions(row),
          onSelect: (key: string) => handleRowAction(row, key)
        })
    },
    { type: 'selection', align: 'center', width: 48 },
    { key: 'roleCode', title: $t('page.manage.role.roleCode'), align: 'center', minWidth: 140 },
    { key: 'roleName', title: $t('page.manage.role.roleName'), align: 'center', minWidth: 140 },
    {
      key: 'state',
      title: $t('page.manage.role.stateLabel'),
      align: 'center',
      width: 100,
      render: row =>
        h(
          NTag,
          { type: row.stateEnum === 'ON' ? 'success' : 'error', size: 'small', bordered: false },
          { default: () => $t(roleStateRecord[row.stateEnum]) }
        )
    },
    { key: 'remark', title: $t('page.manage.role.remark'), align: 'center', minWidth: 160 }
  ],
  onPaginationParamsChange: paginationParams => {
    params.page = paginationParams.page ?? 1;
    params.size = paginationParams.pageSize ?? 10;
  }
});

const { drawerVisible, openDrawer, closeDrawer, operateType, editingData, handleAdd } = useTableOperate(
  data,
  'id',
  getData
);

const editRow = computed(() => editingData.value as unknown as Api.SystemManage.RoleForm | null);

const { bool: authVisible, setTrue: openAuth } = useBoolean();
const authRoleId = ref('');

function handleEdit(id: string) {
  const row = data.value.find(item => item.id === id);

  if (row) {
    operateType.value = 'edit';
    editingData.value = row as unknown as Api.SystemManage.Role;
    openDrawer();
  }
}

function handleAuth(id: string) {
  authRoleId.value = id;
  openAuth();
}

function handleRowAction(row: Api.SystemManage.Role, key: string) {
  if (key === 'edit') {
    handleEdit(row.id);
  } else if (key === 'menuAuth') {
    handleAuth(row.id);
  }
}

function handleSearch() {
  params.items = toQueryItems(searchConditions.value);
  params.page = 1;

  getDataByPage(1);
}

/** Reset only restores the query params to default, without sending a request */
function handleReset() {
  params.items = [];
  params.page = 1;
}

async function handleSubmitted() {
  closeDrawer();
  await getData();
}

async function handleAuthSubmitted() {
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
            <NButton size="small" ghost type="primary" @click="handleAdd">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
          </template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="row => row.id"
        :pagination="mobilePagination"
        remote
        flex-height
        class="h-full"
      />
    </NCard>
    <RoleOperateModal
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row="editRow"
      @submitted="handleSubmitted"
    />
    <MenuAuthModal v-model:visible="authVisible" :role-id="authRoleId" @submitted="handleAuthSubmitted" />
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
