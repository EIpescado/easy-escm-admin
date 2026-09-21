<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchDeleteMenu, fetchGetMenuTree } from '@/service/api';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import MenuOperateModal from './modules/menu-operate-modal.vue';

defineOptions({
  name: 'ManageMenu'
});

const loading = ref(false);
const menuTree = ref<Api.SystemManage.MenuNode[]>([]);

const rootPid = computed(() => menuTree.value[0]?.pid ?? '0');

async function getData() {
  loading.value = true;

  const { data, error } = await fetchGetMenuTree();

  if (!error) {
    menuTree.value = data || [];
  }

  loading.value = false;
}

getData();

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingRow = ref<Api.SystemManage.MenuForm | null>(null);
const parentId = ref<string>(rootPid.value);

function toForm(row: Api.SystemManage.MenuNode): Api.SystemManage.MenuForm {
  return {
    id: row.id,
    pid: row.pid,
    title: row.meta?.title ?? row.name,
    routerName: row.name,
    component: row.component,
    path: row.path,
    icon: row.meta?.icon,
    cached: row.meta?.keepAlive ?? true,
    hidden: row.meta?.hideInMenu ?? false,
    activeMenu: row.meta?.activeMenu,
    sortNo: row.meta?.order ?? 1
  };
}

function handleAdd(row?: Api.SystemManage.MenuNode) {
  operateType.value = 'add';
  editingRow.value = null;
  parentId.value = row?.id ?? rootPid.value;
  openModal();
}

function handleEdit(row: Api.SystemManage.MenuNode) {
  operateType.value = 'edit';
  editingRow.value = toForm(row);
  parentId.value = row.pid;
  openModal();
}

function handleDelete(id: string) {
  window.$dialog?.warning({
    title: $t('common.tip'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchDeleteMenu({ menuIds: [id] });

      if (!error) {
        window.$message?.success($t('common.deleteSuccess'));
        await getData();
      }
    }
  });
}

function handleRowAction(row: Api.SystemManage.MenuNode, key: string) {
  if (key === 'add') {
    handleAdd(row);
  } else if (key === 'edit') {
    handleEdit(row);
  } else if (key === 'delete') {
    handleDelete(row.id);
  }
}

async function handleSubmitted() {
  closeModal();
  await getData();
}

function getOperateOptions(_row: Api.SystemManage.MenuNode) {
  return [
    { key: 'add', label: $t('common.add') },
    { key: 'edit', label: $t('common.edit') },
    { key: 'delete', label: $t('common.delete'), danger: true }
  ];
}

const operateColumnWidth = getTableOperateColumnWidth(
  [$t('common.add'), $t('common.edit'), $t('common.delete')],
  2,
  28
);

const columns: NaiveUI.TableColumn<Api.SystemManage.MenuNode>[] = [
  {
    key: 'operate',
    title: $t('common.operate'),
    align: 'center',
    width: operateColumnWidth,
    render: (row: Api.SystemManage.MenuNode) =>
      h(TableRowOperation, {
        options: getOperateOptions(row),
        onSelect: (key: string) => handleRowAction(row, key)
      })
  },
  {
    key: 'title',
    title: $t('page.manage.menu.title'),
    minWidth: 180,
    render: (row: Api.SystemManage.MenuNode) => row.meta?.title || row.name
  },
  {
    key: 'name',
    title: $t('page.manage.menu.name'),
    minWidth: 140,
    render: (row: Api.SystemManage.MenuNode) => row.name
  },
  {
    key: 'path',
    title: $t('page.manage.menu.path'),
    minWidth: 180,
    render: (row: Api.SystemManage.MenuNode) => row.path
  },
  {
    key: 'component',
    title: $t('page.manage.menu.component'),
    minWidth: 200,
    render: (row: Api.SystemManage.MenuNode) => row.component
  },
  {
    key: 'icon',
    title: $t('page.manage.menu.icon'),
    minWidth: 140,
    render: (row: Api.SystemManage.MenuNode) => row.meta?.icon || '-'
  },
  {
    key: 'order',
    title: $t('page.manage.menu.order'),
    width: 80,
    align: 'center',
    render: (row: Api.SystemManage.MenuNode) => row.meta?.order ?? '-'
  }
];
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
      <template #header>
        <div class="flex items-center justify-between">
          <NSpace>
            <NButton size="small" ghost type="primary" @click="handleAdd()">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
          </NSpace>
          <NSpace>
            <NButton size="small" :loading="loading" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
              {{ $t('common.refresh') }}
            </NButton>
          </NSpace>
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="menuTree"
        :loading="loading"
        :row-key="row => row.id"
        default-expand-all
        flex-height
        class="h-full"
      />
    </NCard>
    <MenuOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingRow"
      :parent-id="parentId"
      :root-pid="rootPid"
      :tree="menuTree"
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
