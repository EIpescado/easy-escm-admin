<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue';
import { useBoolean } from '@sa/hooks';
import { fetchFileDownload, fetchPageSearch, fetchToggleSpecialFileState } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { enableStateOptions } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import { getDownloadFileName, saveBlob } from '@/utils/file';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';
import SpecialFileOperateModal from './modules/special-file-operate-modal.vue';

defineOptions({
  name: 'ManageSpecialFile'
});

/** users, used to render the owner names */
const users = ref<Api.SystemManage.User[]>([]);

const userNameMap = computed(() => new Map(users.value.map(user => [user.id, user.nickname || user.username])));

async function loadOptions() {
  const { data, error } = await fetchPageSearch<Api.SystemManage.User>('/system/user/search', {
    page: 1,
    size: 200,
    items: [],
    orders: []
  });

  if (!error) {
    users.value = data?.rows ?? [];
  }
}

onMounted(loadOptions);
// reload when the page is re-activated, the user list may have changed meanwhile
onActivated(loadOptions);

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.specialFile.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  { prop: 'code', label: $t('page.manage.specialFile.code'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'fileName', label: $t('page.manage.specialFile.fileName'), valueType: 'text', types: ['like'] },
  {
    prop: 'state',
    label: $t('page.manage.specialFile.state'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(enableStateOptions)
  },
  { prop: 'remark', label: $t('page.manage.specialFile.remark'), valueType: 'text', types: ['like'] }
]);

/** Data columns; the operate column is added by the list */
const columns = computed<ManageColumn<Api.SystemManage.SpecialFile>[]>(() => [
  { key: 'code', title: $t('page.manage.specialFile.code'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'fileName', title: $t('page.manage.specialFile.fileName'), minWidth: 220, ellipsis: { tooltip: true } },
  {
    key: 'userId',
    title: $t('page.manage.specialFile.userName'),
    align: 'center',
    minWidth: 130,
    ellipsis: { tooltip: true },
    render: row => (row.userId ? (userNameMap.value.get(row.userId) ?? row.userId) : $t('page.manage.specialFile.all'))
  },
  { key: 'state', title: $t('page.manage.specialFile.state'), align: 'center', width: 100, cell: 'enabled' },
  { key: 'remark', title: $t('page.manage.specialFile.remark'), minWidth: 160, ellipsis: { tooltip: true } },
  { key: 'createTime', title: $t('page.manage.specialFile.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
}

const listRef = ref<ManageListInstance | null>(null);

async function refreshList() {
  await listRef.value?.getData();
}

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.SpecialFile | null>(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: Api.SystemManage.SpecialFile) {
  operateType.value = 'edit';
  editingData.value = row;
  openModal();
}

/** download can be slow, block a second click meanwhile */
const downloading = ref(false);

/** download the file behind a row; the row references a file record by `fileId` */
async function handleDownload(row: Api.SystemManage.SpecialFile) {
  if (!row.fileId || downloading.value) return;

  downloading.value = true;

  try {
    const { data, error, response } = await fetchFileDownload([row.fileId]);

    if (error) return;

    // the backend falls back to a JSON body when the download fails
    if (!(data instanceof Blob)) {
      window.$message?.error($t('page.manage.file.downloadFailed'));

      return;
    }

    saveBlob(data, getDownloadFileName(response, row.fileName || 'download'));
  } finally {
    downloading.value = false;
  }
}

function handleSetState(row: Api.SystemManage.SpecialFile, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.specialFile.enableConfirm' : 'page.manage.specialFile.disableConfirm', {
      name: row.code
    }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleSpecialFileState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Button state rules: the backend To returns the bare `ON` / `OFF` state, without `stateEnum` */
const buttonRules: PageButtonStateRules<Api.SystemManage.SpecialFile> = {
  enable: ({ rows }) => !rows.some(row => row.state !== 'ON'),
  disable: ({ rows }) => !rows.some(row => row.state === 'ON'),
  update: ({ rows }) => rows.length !== 1,
  // a row without a file record has nothing to download
  download: ({ rows }) => rows.every(row => !row.fileId)
};

/** Toolbar buttons, dispatched by the backend button `click` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleAdd };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Row action handlers, dispatched by the backend button `click` */
function handleRowAction(row: Api.SystemManage.SpecialFile, click: string) {
  const handlers: Record<string, (target: Api.SystemManage.SpecialFile) => void> = {
    update: handleEdit,
    download: handleDownload,
    enable: target => handleSetState(target, true),
    disable: target => handleSetState(target, false)
  };

  const handler = handlers[click];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

async function handleSubmitted() {
  closeModal();
  await refreshList();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_special-file"
      class="min-h-0 flex-1"
      url="/system/specialFile/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      @toolbar-action="handleToolbarAction"
    />
    <SpecialFileOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingData"
      @submitted="handleSubmitted"
    />
  </div>
</template>
