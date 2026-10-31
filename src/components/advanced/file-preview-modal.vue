<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { fetchFileDownload } from '@/service/api';
import { getDownloadFileName, saveBlob } from '@/utils/file';
import { $t } from '@/locales';

defineOptions({
  name: 'FilePreviewModal'
});

/** what the dialog renders, resolved from the file type */
type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported';

/** common browser-renderable images */
const IMAGE_TYPES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'avif']);
const VIDEO_TYPES = new Set(['mp4', 'webm', 'ogv']);
const AUDIO_TYPES = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);
const TEXT_TYPES = new Set([
  'txt',
  'text',
  'json',
  'xml',
  'yml',
  'yaml',
  'log',
  'md',
  'markdown',
  'csv',
  'ini',
  'conf',
  'properties',
  'sql',
  'js',
  'ts',
  'css',
  'html',
  'htm',
  'ftl',
  'ftlh'
]);

/** text files above this size are not read into the dialog */
const MAX_TEXT_SIZE = 1024 * 1024;

/** the fields this dialog needs; a `SystemFile` row satisfies it as well */
interface PreviewFile {
  id: string;
  fileName?: string | null;
  fileType?: string | null;
}

interface Props {
  /** the file to preview */
  file: PreviewFile | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const kind = ref<PreviewKind>('unsupported');
const loading = ref(false);
const failed = ref(false);
const tooLarge = ref(false);
const downloading = ref(false);

/** object url of the fetched file, for the image / pdf / media previews */
const objectUrl = ref('');

/** decoded content of a text file */
const textContent = ref('');

/** increments on every open, drops a response of a superseded one */
let requestToken = 0;

/** extension of the file, falling back to the backend `fileType` */
function resolveType(file: PreviewFile) {
  const name = file.fileName ?? '';
  const dot = name.lastIndexOf('.');

  if (dot > -1 && dot < name.length - 1) return name.slice(dot + 1).toLowerCase();

  return (file.fileType ?? '').toLowerCase();
}

function resolveKind(file: PreviewFile | null): PreviewKind {
  if (!file) return 'unsupported';

  const type = resolveType(file);

  if (IMAGE_TYPES.has(type)) return 'image';
  if (type === 'pdf') return 'pdf';
  if (VIDEO_TYPES.has(type)) return 'video';
  if (AUDIO_TYPES.has(type)) return 'audio';
  if (TEXT_TYPES.has(type)) return 'text';

  return 'unsupported';
}

/** release the object url so the blob can be garbage collected */
function releaseObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
  }
}

function reset() {
  releaseObjectUrl();
  loading.value = false;
  failed.value = false;
  tooLarge.value = false;
  textContent.value = '';
}

watch(visible, async val => {
  // closing: drop any in-flight response and free the blob
  if (!val) {
    requestToken++;
    reset();

    return;
  }

  reset();

  const file = props.file;

  if (!file) return;

  kind.value = resolveKind(file);

  // nothing to fetch for a type the browser cannot render
  if (kind.value === 'unsupported') return;

  const token = ++requestToken;

  loading.value = true;

  const { data, error } = await fetchFileDownload([file.id]);

  if (token !== requestToken) return;

  loading.value = false;

  if (error || !(data instanceof Blob)) {
    failed.value = true;

    return;
  }

  if (kind.value === 'text') {
    if (data.size > MAX_TEXT_SIZE) {
      tooLarge.value = true;

      return;
    }

    textContent.value = await data.text();

    return;
  }

  objectUrl.value = URL.createObjectURL(data);
});

/** download the file when the browser cannot preview it (or the preview failed) */
async function downloadFile() {
  const file = props.file;

  if (!file || downloading.value) return;

  downloading.value = true;

  try {
    const { data, error, response } = await fetchFileDownload([file.id]);

    if (error || !(data instanceof Blob)) {
      window.$message?.error($t('page.manage.file.downloadFailed'));

      return;
    }

    saveBlob(data, getDownloadFileName(response, file.fileName || 'download'));
  } finally {
    downloading.value = false;
  }
}

onBeforeUnmount(releaseObjectUrl);
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    class="file-preview-modal"
    :title="file?.fileName ?? ''"
    :mask-closable="false"
    :style="{ width: '70vw', maxWidth: '1080px' }"
  >
    <div class="preview-body">
      <div v-if="loading" class="h-full flex-center">
        <NSpin :size="24" />
      </div>
      <div v-else-if="failed" class="h-full flex-center text-14px text-gray-400">
        {{ $t('page.manage.file.previewFailed') }}
      </div>
      <div v-else-if="tooLarge" class="h-full flex-center text-14px text-gray-400">
        {{ $t('page.manage.file.previewTooLarge') }}
      </div>
      <img
        v-else-if="kind === 'image'"
        :src="objectUrl"
        :alt="file?.fileName ?? ''"
        class="mx-auto block max-h-full max-w-full object-contain"
      />
      <iframe
        v-else-if="kind === 'pdf'"
        :src="objectUrl"
        class="h-full w-full border-0"
        :title="file?.fileName ?? undefined"
      />
      <video v-else-if="kind === 'video'" :src="objectUrl" controls class="mx-auto block max-h-full max-w-full" />
      <audio v-else-if="kind === 'audio'" :src="objectUrl" controls class="mx-auto block w-full" />
      <pre v-else-if="kind === 'text'" class="preview-text">{{ textContent }}</pre>
      <div v-else class="h-full flex flex-col items-center justify-center gap-12px">
        <icon-mdi-file-question-outline class="text-48px text-gray-300" />
        <span class="text-14px text-gray-400">{{ $t('page.manage.file.previewUnsupported') }}</span>
        <NButton type="primary" :loading="downloading" :disabled="downloading" @click="downloadFile">
          {{ $t('page.manage.file.previewDownload') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
/* tall enough to read a page, short enough to stay inside the viewport */
.preview-body {
  height: 62vh;
  min-height: 240px;
}

.preview-text {
  height: 100%;
  margin: 0;
  overflow: auto;
  font-family: v-mono, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
