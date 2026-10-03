<script setup lang="ts">
import { ref } from 'vue';
import type { AxiosResponse } from 'axios';
import type { FlatResponseData } from '@sa/axios';
import { $t } from '@/locales';

defineOptions({
  name: 'TableExportButton'
});

interface Props {
  /** Export api, it should request the backend with `export: true` and `responseType: 'blob'` */
  api: () => Promise<FlatResponseData<any, Blob>>;
  /**
   * Minimum loading duration in ms, avoids loading flicker
   *
   * @default 600
   */
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  delay: 600
});

const loading = ref(false);

/** Read the file name from the `content-disposition` header */
function getFileName(response?: AxiosResponse) {
  const disposition = response?.headers?.['content-disposition'] as string | undefined;
  const matched = disposition
    ?.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)?.[1]
    ?.replace(/"/g, '')
    .trim();

  if (!matched) return `export-${Date.now()}.xlsx`;

  try {
    return decodeURIComponent(matched.replace(/\+/g, ' '));
  } catch {
    return matched;
  }
}

/** Trigger a browser download for the blob */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

async function handleExport() {
  if (loading.value) return;

  loading.value = true;

  try {
    // keep the loading state for at least `delay` ms to avoid loading flicker
    const [result] = await Promise.all([
      props.api(),
      props.delay > 0 ? new Promise(resolve => setTimeout(resolve, props.delay)) : Promise.resolve(null)
    ]);

    // network / http errors are already reported by the request interceptor
    if (result.error) return;

    const data = result.data as unknown;

    // the backend falls back to a JSON body when the export fails
    if (!(data instanceof Blob)) {
      const message = (data as { message?: string } | null)?.message ?? $t('common.error');

      window.$message?.error(message);
      return;
    }

    saveBlob(data, getFileName(result.response));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <NButton size="small" :loading="loading" @click="handleExport">
    <template #icon>
      <icon-mdi-download class="text-icon" />
    </template>
    {{ $t('common.export') }}
  </NButton>
</template>
