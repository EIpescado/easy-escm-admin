<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules, UploadFileInfo } from 'naive-ui';
import { fetchFileCheckChunk, fetchFileChunkUpload, fetchFileMergeChunk, fetchFileUpload } from '@/service/api';
import { useNaiveForm } from '@/hooks/common/form';
import { formatFileSize, getFileMd5 } from '@/utils/file';
import { $t } from '@/locales';
import RemoteSelect from '@/components/advanced/remote-select.vue';

defineOptions({
  name: 'FileUploadModal'
});

/** files up to this size are uploaded in one request, larger ones in chunks (matches the backend default) */
const SIMPLE_UPLOAD_LIMIT = 5 * 1024 * 1024;

/** dictionary holding the file tags */
const DICT_FILE_TAG = 'system_file_tag';

/** the hashing / chunk phases own a slice of the 0-100 progress bar */
const HASH_PROGRESS_END = 20;
const CHUNK_PROGRESS_END = 90;

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  /** a file was stored by the backend */
  (e: 'uploaded', file: Api.SystemManage.SystemFile): void;
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();

type UploadPhase = 'idle' | 'hashing' | 'checking' | 'uploading' | 'merging';

const model = reactive<{ fileTag: string | null; file: File | null }>({
  fileTag: null,
  file: null
});

/** the single file of the built-in upload widget */
const fileList = ref<UploadFileInfo[]>([]);

/** current phase, drives the status text and drives whether progress is shown */
const phase = ref<UploadPhase>('idle');

/** overall progress, 0-100 */
const progress = ref(0);

const rules: FormRules = {
  fileTag: {
    required: true,
    message: () => $t('page.manage.file.selectFileTag'),
    trigger: ['change', 'blur']
  },
  file: {
    // a custom validator: a `File` value must not go through async-validator's default string check
    validator: () => Boolean(model.file),
    message: () => $t('page.manage.file.selectFileRequired'),
    trigger: ['change', 'blur']
  }
};

/** keep the form model in sync with the widget, including the removal of the selected file */
watch(fileList, list => {
  model.file = (list[0]?.file as File | undefined) ?? null;
});

const phaseText = computed(() => {
  switch (phase.value) {
    case 'hashing':
      return $t('page.manage.file.phase.hashing');
    case 'checking':
      return $t('page.manage.file.phase.checking');
    case 'uploading':
      return $t('page.manage.file.phase.uploading', { percent: progress.value });
    case 'merging':
      return $t('page.manage.file.phase.merging');
    default:
      return '';
  }
});

// reset every run so a reopened dialog never shows stale state
watch(visible, val => {
  if (!val) return;

  model.fileTag = null;
  model.file = null;
  fileList.value = [];
  phase.value = 'idle';
  progress.value = 0;
  restoreValidation();
});

/**
 * Chunked upload: hash → check (instant upload / resume) → upload the missing chunks → merge
 *
 * The progress bar reserves the first {@link HASH_PROGRESS_END} percent for hashing and the last
 * tenth for the merge, the middle is the chunk transfer.
 *
 * @returns the stored file, or `null` when the upload failed
 */
async function uploadInChunks(file: File, fileTag: string): Promise<Api.SystemManage.SystemFile | null> {
  phase.value = 'hashing';
  progress.value = 0;

  const identifier = await getFileMd5(file, percent => {
    progress.value = Math.round((percent / 100) * HASH_PROGRESS_END);
  });

  phase.value = 'checking';

  const { data: check, error: checkError } = await fetchFileCheckChunk({
    identifier,
    fileName: file.name,
    fileSize: file.size
  });

  if (checkError || !check) return null;

  // instant upload: the backend already stores the same content
  if (check.uploaded) {
    progress.value = 100;

    return check.file ?? null;
  }

  const chunkSize = Number(check.chunkSize) || SIMPLE_UPLOAD_LIMIT;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploaded = new Set(check.uploadedChunks ?? []);

  phase.value = 'uploading';

  let uploadedBytes = uploaded.size * chunkSize;

  function updateProgress() {
    const ratio = Math.min(uploadedBytes / file.size, 1);
    progress.value = Math.round(HASH_PROGRESS_END + ratio * (CHUNK_PROGRESS_END - HASH_PROGRESS_END));
  }

  updateProgress();

  for (let index = 0; index < totalChunks; index += 1) {
    // resume: skip the chunks the backend already has
    if (uploaded.has(index)) continue;

    const start = index * chunkSize;
    const chunk = file.slice(start, Math.min(start + chunkSize, file.size));

    const { error } = await fetchFileChunkUpload({
      file: chunk,
      identifier,
      chunkIndex: index,
      totalChunks,
      fileName: file.name,
      fileTag
    });

    if (error) return null;

    uploadedBytes += chunk.size;
    updateProgress();
  }

  phase.value = 'merging';
  progress.value = CHUNK_PROGRESS_END;

  const { data: merged, error: mergeError } = await fetchFileMergeChunk({
    identifier,
    fileName: file.name,
    totalChunks,
    fileTag,
    fileSize: file.size
  });

  if (mergeError) return null;

  progress.value = 100;

  return merged ?? null;
}

/** upload a small file in one request */
async function uploadInOneRequest(file: File, fileTag: string) {
  phase.value = 'uploading';
  progress.value = 0;

  const { data, error } = await fetchFileUpload({ file, fileTag });

  if (error) return null;

  progress.value = 100;

  return data ?? null;
}

async function handleSubmit() {
  const file = model.file;
  const fileTag = model.fileTag;

  if (!file || !fileTag) return;

  try {
    const uploaded =
      file.size <= SIMPLE_UPLOAD_LIMIT ? await uploadInOneRequest(file, fileTag) : await uploadInChunks(file, fileTag);

    if (!uploaded) return;

    window.$message?.success($t('page.manage.file.uploadSuccess'));
    emit('uploaded', uploaded);
    emit('submitted');
    visible.value = false;
  } finally {
    phase.value = 'idle';
    progress.value = 0;
  }
}
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="$t('page.manage.file.uploadTitle')"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NAlert class="col-span-2 mb-8px" type="info" :bordered="false">
      {{ $t('page.manage.file.uploadTip', { size: formatFileSize(SIMPLE_UPLOAD_LIMIT) }) }}
    </NAlert>
    <NFormItem path="fileTag">
      <template #label>
        <FormLabel :label="$t('page.manage.file.fileTag')" />
      </template>
      <RemoteSelect
        v-model:value="model.fileTag"
        source="dict"
        :dict-code="DICT_FILE_TAG"
        :placeholder="$t('page.manage.file.selectFileTag')"
      />
    </NFormItem>
    <NFormItem path="file">
      <template #label>
        <FormLabel :label="$t('page.manage.file.file')" />
      </template>
      <NUpload v-model:file-list="fileList" :max="1" :default-upload="false">
        <NButton>{{ $t('page.manage.file.selectFile') }}</NButton>
      </NUpload>
    </NFormItem>
    <div v-if="phase !== 'idle'" class="col-span-2 flex flex-col gap-8px">
      <span class="text-13px">{{ phaseText }}</span>
      <NProgress type="line" :percentage="progress" :show-indicator="false" />
    </div>
  </FormDialog>
</template>

<style scoped></style>
