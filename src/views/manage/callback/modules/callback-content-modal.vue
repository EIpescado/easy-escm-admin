<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import JsonViewer from '@/components/advanced/json-viewer.vue';

defineOptions({
  name: 'CallbackContentModal'
});

interface Props {
  /** dialog title, e.g. the request or the response content */
  title: string;
  /** raw content of the callback record, JSON or plain text */
  content?: string | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

/** parse result of the body: `ok` tells whether the content is a JSON document */
const parsedContent = computed<{ ok: boolean; value: unknown }>(() => {
  const raw = (props.content ?? '').trim();

  if (!raw) return { ok: false, value: null };

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, value: null };
  }
});

/** whether the body is a JSON document, otherwise it is shown as plain text */
const isJson = computed(() => parsedContent.value.ok);

/** pretty printed body, also used by the copy button (plain text keeps its original layout) */
const prettyContent = computed(() => {
  if (!isJson.value) return (props.content ?? '').trim();

  return JSON.stringify(parsedContent.value.value, null, 2);
});

async function copyContent() {
  if (!prettyContent.value) return;

  try {
    await navigator.clipboard.writeText(prettyContent.value);
    window.$message?.success($t('common.copySuccess'));
  } catch {
    window.$message?.error($t('common.copy'));
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="callback-content-modal" :mask-closable="false">
    <div class="max-h-60vh overflow-auto rounded-4px bg-#f7f7fa px-16px py-12px dark:bg-#1e1e1e">
      <JsonViewer v-if="isJson" :value="parsedContent.value" :collapse-depth="2" />
      <pre v-else class="m-0 whitespace-pre-wrap break-all font-mono text-13px leading-20px">{{
        prettyContent || $t('page.manage.callback.noContent')
      }}</pre>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="!prettyContent" @click="copyContent">{{ $t('common.copy') }}</NButton>
        <NButton type="primary" @click="visible = false">{{ $t('common.close') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style>
/* the modal is teleported, so the width cannot live in a scoped style */
.callback-content-modal {
  width: 800px;
  max-width: 92vw;
}
</style>
