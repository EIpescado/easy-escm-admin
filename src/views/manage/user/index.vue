<script setup lang="ts">
import { computed, h, reactive } from 'vue';
import { NButton, NTag } from 'naive-ui';
import { useNaivePaginatedTable, useTableOperate } from '@/hooks/common/table';
import { fetchResetUserPassword, fetchToggleUserState, fetchUserDetail, fetchUserList } from '@/service/api';
import { userStateRecord } from '@/constants/business';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import UserSearch from './modules/user-search.vue';
import UserOperateModal from './modules/user-operate-modal.vue';

defineOptions({
  name: 'ManageUser'
});

const searchForm = reactive<Api.SystemManage.UserSearchModel>({
  username: '',
  nickname: '',
  phone: '',
  state: null
});

function buildItems() {
  const items: Api.SystemManage.QueryItem[] = [];

  if (searchForm.username) items.push({ prop: 'username', values: [searchForm.username], type: 'like' });
  if (searchForm.nickname) items.push({ prop: 'nickname', values: [searchForm.nickname], type: 'like' });
  if (searchForm.phone) items.push({ prop: 'phone', values: [searchForm.phone], type: 'like' });
  if (searchForm.state) items.push({ prop: 'state', values: [searchForm.state], type: 'eq' });

  return items;
}

const params = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: []
});

function getOperateOptions(row: Api.SystemManage.User) {
  return [
    { key: 'edit', label: $t('common.edit') },
    { key: 'resetPassword', label: $t('page.manage.user.resetPassword') },
    {
      key: 'toggleState',
      label: row.stateEnum === 'NORMAL' ? $t('page.manage.user.state.forbidden') : $t('page.manage.user.state.normal'),
      danger: row.stateEnum === 'NORMAL'
    }
  ];
}

const operateColumnWidth = computed(() =>
  getTableOperateColumnWidth([
    $t('common.edit'),
    $t('page.manage.user.resetPassword'),
    $t('page.manage.user.state.forbidden')
  ])
);

const { columns, columnChecks, data, loading, getData, getDataByPage, mobilePagination } = useNaivePaginatedTable({
  api: () => fetchUserList({ page: params.page, size: params.size, items: params.items }),
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
      render: (row: Api.SystemManage.User) =>
        h(TableRowOperation, {
          options: getOperateOptions(row),
          onSelect: (key: string) => handleRowAction(row, key)
        })
    },
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

        return h(NTag, { type, size: 'small', bordered: false }, { default: () => $t(userStateRecord[row.stateEnum]) });
      }
    },
    { key: 'lastLoginTime', title: $t('page.manage.user.lastLoginTime'), align: 'center', minWidth: 170 }
  ],
  onPaginationParamsChange: paginationParams => {
    params.page = paginationParams.page ?? 1;
    params.size = paginationParams.pageSize ?? 10;
  }
});

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
  params.items = buildItems();
  params.page = 1;

  getDataByPage(1);
}

function handleReset() {
  Object.assign(searchForm, { username: '', nickname: '', phone: '', state: null });
  handleSearch();
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

function handleToggleState(row: Api.SystemManage.User) {
  const enable = row.stateEnum !== 'NORMAL';

  window.$dialog?.warning({
    title: $t('common.tip'),
    content: $t('common.confirm'),
    positiveText: $t('common.confirm'),
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

function handleRowAction(row: Api.SystemManage.User, key: string) {
  if (key === 'edit') {
    handleEditUser(row.id);
  } else if (key === 'resetPassword') {
    handleResetPassword(row.id);
  } else if (key === 'toggleState') {
    handleToggleState(row);
  }
}

async function handleSubmitted() {
  closeDrawer();
  await getData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <UserSearch v-model:model="searchForm" class="shrink-0" @search="handleSearch" @reset="handleReset" />
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
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        :loading="loading"
        :row-key="row => row.id"
        :pagination="mobilePagination"
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
