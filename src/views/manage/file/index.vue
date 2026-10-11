<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchDictSelect, fetchFileDownload } from '@/service/api';
import type { PageButtonStateRules } from '@/hooks/business/page-buttons';
import { formatFileSize, getDownloadFileName, saveBlob } from '@/utils/file';
import { getTodayRange } from '@/utils/date';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import FileUploadModal from './modules/file-upload-modal.vue';

defineOptions({
  name: 'ManageFile'
});

/** dictionary holding the file tags, used by the tag column and the search / upload selects */
const DICT_FILE_TAG = 'system_file_tag';

/** file tag options of the `system_file_tag` dictionary */
const tagOptions = ref<Api.SystemManage.DictEntry[]>([]);

/** tag code → label, for the tag column */
const tagLabelMap = computed(() => new Map(tagOptions.value.map(entry => [entry.code, entry.val || entry.code])));

async function loadTagOptions() {
  const { data, error } = await fetchDictSelect(DICT_FILE_TAG);

  if (!error) {
    tagOptions.value = data ?? [];
  }
}

onMounted(loadTagOptions);

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.file.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq'],
    defaultValues: getTodayRange()
  },
  { prop: 'fileName', label: $t('page.manage.file.fileName'), valueType: 'text', types: ['like', 'eq'] },
  { prop: 'fileType', label: $t('page.manage.file.fileType'), valueType: 'text', types: ['eq', 'like'] },
  {
    prop: 'fileTag',
    label: $t('page.manage.file.fileTag'),
    valueType: 'select',
    types: ['eq'],
    options: tagOptions.value.map(entry => ({ label: entry.val || entry.code, value: entry.code }))
  },
  { prop: 'creator', label: $t('page.manage.file.creator'), valueType: 'text', types: ['like'] }
]);

/** tag colors of the enum-like columns */
type TagType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

/** render a value as a small tag, falling back to `-` when empty */
function renderTag(text: string | null | undefined, type: TagType = 'default') {
  return h(NTag, { type, size: 'small', bordered: false }, { default: () => text || '-' });
}

/** Data columns; the selection column is added by the list */
const columns = computed<NaiveUI.TableColumn<Api.SystemManage.SystemFile>[]>(() => [
  { key: 'id', title: $t('page.manage.file.id'), align: 'center', width: 190, ellipsis: { tooltip: true } },
  { key: 'fileName', title: $t('page.manage.file.fileName'), minWidth: 220, ellipsis: { tooltip: true } },
  {
    key: 'fileType',
    title: $t('page.manage.file.fileType'),
    align: 'center',
    width: 110,
    render: row => renderTag(row.fileType, 'info')
  },
  {
    key: 'fileSize',
    title: $t('page.manage.file.fileSize'),
    align: 'center',
    width: 120,
    render: row => formatFileSize(row.fileSize)
  },
  {
    key: 'fileTag',
    title: $t('page.manage.file.fileTag'),
    align: 'center',
    minWidth: 120,
    render: row => renderTag(tagLabelMap.value.get(row.fileTag ?? '') ?? row.fileTag, 'success')
  },
  {
    key: 'bucket',
    title: $t('page.manage.file.bucket'),
    align: 'center',
    minWidth: 120,
    render: row => renderTag(row.bucket)
  },
  {
    key: 'filePath',
    title: $t('page.manage.file.filePath'),
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  {
    key: 'creator',
    title: $t('page.manage.file.creator'),
    align: 'center',
    minWidth: 120,
    ellipsis: { tooltip: true }
  },
  { key: 'createTime', title: $t('page.manage.file.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the checked rows to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
  selectedRows: Api.SystemManage.SystemFile[];
}

const listRef = ref<ManageListInstance | null>(null);

/** download can be slow, block a second click meanwhile */
const downloading = ref(false);

/** download the given files; the backend zips them when there is more than one */
async function downloadRows(rows: Api.SystemManage.SystemFile[]) {
  if (!rows.length || downloading.value) return;

  downloading.value = true;

  try {
    const { data, error, response } = await fetchFileDownload(rows.map(row => row.id));

    if (error) return;

    // the backend falls back to a JSON body when the download fails
    if (!(data instanceof Blob)) {
      window.$message?.error($t('page.manage.file.downloadFailed'));

      return;
    }

    const fallback = rows.length > 1 ? 'files.zip' : rows[0].fileName || 'download';

    saveBlob(data, getDownloadFileName(response, fallback));
  } finally {
    downloading.value = false;
  }
}

/** Button state rules: download needs a selection (the row position always passes a single row) */
const buttonRules: PageButtonStateRules<Api.SystemManage.SystemFile> = {
  download: ({ rows }) => rows.length === 0
};

const { bool: uploadVisible, setTrue: openUpload } = useBoolean();

/** Toolbar buttons, dispatched by the backend button `click` (or the local fallbacks) */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  if (button.click === 'upload') {
    openUpload();

    return;
  }

  if (button.click === 'download') {
    downloadRows(listRef.value?.selectedRows ?? []);

    return;
  }

  window.$message?.info($t('common.lookForward'));
}

/** Row action handlers, dispatched by the backend button `click` */
function handleRowAction(row: Api.SystemManage.SystemFile, click: string) {
  if (click === 'download') {
    downloadRows([row]);

    return;
  }

  window.$message?.info($t('common.lookForward'));
}

async function handleSubmitted() {
  await listRef.value?.getData();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_file"
      class="min-h-0 flex-1"
      url="/system/file/search"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonRules"
      :row-action="handleRowAction"
      selection
      sortable
      @toolbar-action="handleToolbarAction"
    />
    <FileUploadModal v-model:visible="uploadVisible" :tag-options="tagOptions" @submitted="handleSubmitted" />
  </div>
</template>
