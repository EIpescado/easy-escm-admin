<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import { NEllipsis, NTag } from 'naive-ui';
import { useNaivePaginatedTable } from '@/hooks/common/table';
import { usePageButtons } from '@/hooks/business/page-buttons';
import { fetchBindUserDict, fetchDictSearch, fetchUserDictDetail, fetchUserList } from '@/service/api';
import { userStateOptions, userStateRecord } from '@/constants/business';
import { translateOptions } from '@/utils/common';
import { $t } from '@/locales';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import { toQueryItems, type QueryField, type QueryFilterCondition } from '@/components/advanced/query-filter/types';

defineOptions({
  name: 'ManageUserDict'
});

const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'username',
    label: $t('page.manage.user.username'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like']
  },
  {
    prop: 'nickname',
    label: $t('page.manage.user.nickname'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like']
  },
  {
    prop: 'phone',
    label: $t('page.manage.user.phone'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like']
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

const params = reactive<Api.SystemManage.PageQo>({
  page: 1,
  size: 10,
  items: [],
  orders: []
});

/** buttons of the current route, provided by the backend menu tree */
const { leftTopButtons } = usePageButtons();

const { columns, data, loading, getData, getDataByPage, mobilePagination } = useNaivePaginatedTable({
  tableKey: 'manage_user_dict',
  api: () => fetchUserList(params),
  transform: response => {
    const { data: resData, error } = response;

    if (!error) {
      const { rows, page, size, total } = resData;

      return { data: rows || [], pageNum: page, pageSize: size, total };
    }

    return { data: [], pageNum: 1, pageSize: 10, total: 0 };
  },
  columns: () => {
    const tableColumns: NaiveUI.TableColumn<Api.SystemManage.User>[] = [
      { key: 'username', title: $t('page.manage.user.username'), minWidth: 140 },
      { key: 'nickname', title: $t('page.manage.user.nickname'), minWidth: 140 },
      { key: 'phone', title: $t('page.manage.user.phone'), minWidth: 140 },
      {
        key: 'state',
        title: $t('page.manage.user.stateLabel'),
        align: 'center',
        width: 100,
        render: (row: Api.SystemManage.User) =>
          h(
            NTag,
            { type: row.stateEnum === 'NORMAL' ? 'success' : 'error', size: 'small', bordered: false },
            { default: () => $t(userStateRecord[row.stateEnum]) }
          )
      }
    ];

    return tableColumns;
  },
  onPaginationParamsChange: paginationParams => {
    params.page = paginationParams.page ?? 1;
    params.size = paginationParams.pageSize ?? 10;
  }
});

/** selected user (left), drives the dictionaries panel */
const activeUserId = ref('');
const activeUserName = computed(() => data.value.find(row => row.id === activeUserId.value)?.username ?? '');

/** keep a text column on a single line, showing a tooltip when it overflows */
function renderEllipsis(text?: string | number | null) {
  return h(NEllipsis, { tooltip: true }, { default: () => String(text ?? '') || '-' });
}

/** all dictionaries of the system, shown as a selectable list */
const allDicts = ref<Api.SystemManage.Dict[]>([]);
/** whether the selected user owns all dictionaries */
const allDict = ref(false);
/** ids of the dictionaries owned by the selected user */
const checkedDictIds = ref<(string | number)[]>([]);
const dictLoading = ref(false);

/** dictionary columns: a selection column plus the dictionary fields */
const dictColumns = computed<NaiveUI.TableColumn<Api.SystemManage.Dict>[]>(() => [
  { type: 'selection', disabled: () => allDict.value },
  { key: 'code', title: $t('page.manage.dict.code'), minWidth: 120, render: row => renderEllipsis(row.code) },
  { key: 'name', title: $t('page.manage.dict.name'), minWidth: 120, render: row => renderEllipsis(row.name) },
  { key: 'remark', title: $t('page.manage.dict.remark'), minWidth: 120, render: row => renderEllipsis(row.remark) }
]);

async function loadAllDicts() {
  dictLoading.value = true;

  const { data: res } = await fetchDictSearch({ page: 1, size: 999, items: [], orders: [] });

  allDicts.value = res?.rows ?? [];
  dictLoading.value = false;
}

loadAllDicts();

async function selectUser(row: Api.SystemManage.User) {
  activeUserId.value = row.id;

  const { data: detail } = await fetchUserDictDetail(row.id);

  // ignore stale responses when the selection changed while loading
  if (activeUserId.value !== row.id) return;

  allDict.value = Boolean(detail?.allDict);
  checkedDictIds.value = (detail?.dictIds ?? []).map(dict => dict.id);
}

function rowClassName(row: Api.SystemManage.User) {
  return row.id === activeUserId.value ? 'user-dict-row--active' : '';
}

function rowProps(row: Api.SystemManage.User) {
  return {
    style: 'cursor: pointer',
    onClick: () => selectUser(row)
  };
}

/** clear the selection when the selected user is no longer in the list */
watch(data, rows => {
  if (!rows.some(row => row.id === activeUserId.value)) {
    activeUserId.value = '';
    allDict.value = false;
    checkedDictIds.value = [];
  }
});

async function handleBind() {
  if (!activeUserId.value) {
    window.$message?.warning($t('page.manage.dict.selectUser'));

    return;
  }

  const { error } = await fetchBindUserDict({
    userId: activeUserId.value,
    allDict: allDict.value,
    dictIds: checkedDictIds.value as string[]
  });

  if (!error) {
    window.$message?.success($t('page.manage.role.menuAuthSuccess'));
  }
}

function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = {
    bind: handleBind,
    bindUserDict: handleBind,
    save: handleBind
  };

  const handler = handlers[button.click ?? ''];

  if (handler) handler();
  else window.$message?.info($t('common.lookForward'));
}

function handleSearch() {
  params.items = toQueryItems(searchConditions.value);
  params.page = 1;

  getDataByPage(1);
}

function handleReset() {
  params.items = [];
  params.page = 1;
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
    <div class="min-h-0 flex flex-1 gap-16px overflow-hidden">
      <NCard :bordered="false" size="small" class="min-w-0 min-h-0 flex-[6] card-wrapper">
        <template #header>
          <div class="flex items-center justify-between">
            <span>{{ $t('route.manage_user') }}</span>
            <NButton size="small" :loading="loading" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
              {{ $t('common.refresh') }}
            </NButton>
          </div>
        </template>
        <NDataTable
          :columns="columns"
          :data="data"
          :loading="loading"
          :row-key="row => row.id"
          :row-class-name="rowClassName"
          :row-props="rowProps"
          :pagination="mobilePagination"
          :paginate-single-page="true"
          remote
          flex-height
          class="h-full"
        />
      </NCard>
      <NCard :bordered="false" size="small" class="min-w-0 min-h-0 flex-[4] card-wrapper">
        <template #header>
          <div class="min-w-0 flex items-center justify-between gap-8px">
            <span class="truncate">
              {{
                activeUserId
                  ? `${$t('page.manage.dict.ownedDict')} · ${activeUserName}`
                  : $t('page.manage.dict.ownedDict')
              }}
            </span>
            <TableToolbarButtons :buttons="leftTopButtons" @select="handleToolbarAction" />
          </div>
        </template>
        <div v-if="activeUserId" class="h-full min-h-0 flex flex-col gap-8px">
          <NCheckbox v-model:checked="allDict" class="shrink-0">{{ $t('page.manage.dict.allDict') }}</NCheckbox>
          <NDataTable
            v-model:checked-row-keys="checkedDictIds"
            :columns="dictColumns"
            :data="allDicts"
            :loading="dictLoading"
            :row-key="row => row.id"
            :paginate-single-page="true"
            size="small"
            flex-height
            class="min-h-0 flex-1"
          />
        </div>
        <NEmpty v-else class="mt-80px" :description="$t('page.manage.dict.selectUser')" />
      </NCard>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* the selected user row */
:deep(.user-dict-row--active .n-data-table-td) {
  background-color: var(--n-td-color-hover, rgba(0, 0, 0, 0.04));
}

.card-wrapper :deep(.n-card__content) {
  min-height: 0;
}
</style>
