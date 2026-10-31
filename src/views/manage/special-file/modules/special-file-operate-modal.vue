<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules, UploadFileInfo } from 'naive-ui';
import {
  fetchCreateSpecialFile,
  fetchFileDownload,
  fetchSpecialFileDetail,
  fetchUpdateSpecialFile
} from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { getDownloadFileName, saveBlob } from '@/utils/file';
import FilePreviewModal from '@/components/advanced/file-preview-modal.vue';
import FileUploadModal from '@/components/advanced/file-upload-modal.vue';
import RemoteSelect from '@/components/advanced/remote-select.vue';

defineOptions({
  name: 'SpecialFileOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.SpecialFile | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** the upload dialog of the file field */
const uploadVisible = ref(false);

/** the preview dialog of the attached file */
const previewVisible = ref(false);

/** download can be slow, block a second click meanwhile */
const downloading = ref(false);

interface SpecialFileModel {
  id?: string;
  code: string;
  fileId: string | null;
  fileName: string | null;
  userId: string | null;
  state: string;
  remark: string;
}

function createEmptyModel(): SpecialFileModel {
  return {
    id: undefined,
    code: '',
    fileId: null,
    fileName: null,
    userId: null,
    state: 'ON',
    remark: ''
  };
}

const model = reactive<SpecialFileModel>(createEmptyModel());

/** the edit detail is being loaded */
const loading = ref(false);

/** increments on every open, drops a detail response of a superseded open */
let detailToken = 0;

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.specialFile.createTitle' : 'page.manage.specialFile.editTitle')
);

/** label of the selected user, so an edit shows it before the remote page arrives */
const userFallback = computed(() => (props.row?.userId ? { label: props.row.userId, value: props.row.userId } : null));

const rules: FormRules = {
  code: defaultRequiredRule,
  fileId: defaultRequiredRule
};

function fillFrom(detail: Api.SystemManage.SpecialFile) {
  Object.assign(model, {
    id: detail.id,
    code: detail.code ?? '',
    fileId: detail.fileId ?? null,
    fileName: detail.fileName ?? null,
    userId: detail.userId ?? null,
    state: detail.stateEnum ?? detail.state ?? props.row?.stateEnum ?? props.row?.state ?? 'ON',
    remark: detail.remark ?? ''
  });
}

watch(visible, async val => {
  if (!val) return;

  restoreValidation();
  Object.assign(model, createEmptyModel());

  const token = ++detailToken;

  if (props.operateType === 'edit' && props.row) {
    loading.value = true;

    const { data, error } = await fetchSpecialFileDetail(props.row.id);

    // ignore the response when the dialog was closed or reopened meanwhile
    if (token !== detailToken || !visible.value) return;

    if (!error && data) {
      fillFrom(data);
    }

    loading.value = false;
  } else {
    loading.value = false;
  }
});

/** keep the uploaded file, the backend stores its id and the explicit name */
function handleUploaded(file: Api.SystemManage.SystemFile) {
  model.fileId = file.id;
  model.fileName = file.fileName;
}

function clearFile() {
  model.fileId = null;
  model.fileName = null;
}

/** the attached file rendered by the NUpload file list (status `finished` shows its buttons) */
const fileList = computed<UploadFileInfo[]>(() =>
  model.fileId
    ? [
        {
          id: model.fileId,
          name: model.fileName || model.fileId,
          status: 'finished',
          url: ''
        }
      ]
    : []
);

/** the attached file, handed to the preview dialog */
const previewFile = computed(() => (model.fileId ? { id: model.fileId, fileName: model.fileName } : null));

function handleRemoveFile() {
  clearFile();

  return true;
}

function handlePreviewFile() {
  previewVisible.value = true;
}

/** the list item's download button streams the file through the API, not its (empty) url */
function handleDownloadFile() {
  void downloadFile();

  return false;
}

/** download the attached file, the same endpoint the list row uses */
async function downloadFile() {
  if (!model.fileId || downloading.value) return;

  downloading.value = true;

  try {
    const { data, error, response } = await fetchFileDownload([model.fileId]);

    if (error || !(data instanceof Blob)) {
      window.$message?.error($t('page.manage.file.downloadFailed'));

      return;
    }

    saveBlob(data, getDownloadFileName(response, model.fileName || 'download'));
  } finally {
    downloading.value = false;
  }
}

async function handleSubmit() {
  const payload: Api.SystemManage.SpecialFileForm = {
    id: model.id,
    code: model.code.trim(),
    fileId: model.fileId,
    fileName: model.fileName || undefined,
    userId: model.userId || undefined,
    state: model.state,
    remark: model.remark || undefined
  };

  const { error } =
    props.operateType === 'add' ? await fetchCreateSpecialFile(payload) : await fetchUpdateSpecialFile(payload);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="title"
    :loading="loading"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NFormItem path="code">
      <template #label>
        <FormLabel :label="$t('page.manage.specialFile.code')" :tip="$t('page.manage.specialFile.codeTip')" />
      </template>
      <NInput v-model:value="model.code" :placeholder="$t('page.manage.specialFile.codePlaceholder')" />
    </NFormItem>
    <NFormItem path="fileId">
      <template #label>
        <FormLabel :label="$t('page.manage.specialFile.file')" />
      </template>
      <div class="w-full flex items-center gap-8px">
        <div class="min-w-0 flex-1">
          <NUpload
            v-if="fileList.length"
            :file-list="fileList"
            :show-trigger="false"
            :show-download-button="true"
            :default-upload="false"
            @remove="handleRemoveFile"
            @download="handleDownloadFile"
            @preview="handlePreviewFile"
          />
          <span v-else class="text-14px text-gray-400">
            {{ $t('page.manage.specialFile.filePlaceholder') }}
          </span>
        </div>
        <NButton type="primary" ghost @click="uploadVisible = true">
          {{ $t('page.manage.specialFile.uploadFile') }}
        </NButton>
      </div>
    </NFormItem>
    <NFormItem path="userId">
      <template #label>
        <FormLabel :label="$t('page.manage.specialFile.userName')" :tip="$t('page.manage.specialFile.userTip')" />
      </template>
      <RemoteSelect
        v-model:value="model.userId"
        source="user"
        :fallback-option="userFallback"
        :placeholder="$t('page.manage.specialFile.all')"
      />
    </NFormItem>
    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.specialFile.remark')" />
      </template>
      <NInput
        v-model:value="model.remark"
        type="textarea"
        :rows="3"
        :placeholder="$t('page.manage.specialFile.remark')"
      />
    </NFormItem>
    <FileUploadModal v-model:visible="uploadVisible" @uploaded="handleUploaded" />
    <FilePreviewModal v-model:visible="previewVisible" :file="previewFile" />
  </FormDialog>
</template>

<style scoped></style>
