<script setup lang="ts">
import { ref } from 'vue';
import type { FlatResponseData } from '@sa/axios';
import { getDownloadFileName, saveBlob } from '@/utils/file';
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

    saveBlob(data, getDownloadFileName(result.response, `export-${Date.now()}.xlsx`));
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
