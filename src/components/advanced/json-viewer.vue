<script setup lang="ts">
import { provide, ref } from 'vue';
import { $t } from '@/locales';
import JsonNode from './json-node.vue';

defineOptions({
  name: 'JsonViewer'
});

interface Props {
  /** parsed JSON value */
  value: unknown;
  /** nodes deeper than this are collapsed on first render, defaults to 2 */
  collapseDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  collapseDepth: 2
});

/** the version increments on every expand / collapse all, the nodes watch it */
const version = ref(0);
const expandAll = ref(true);

provide('json-viewer-control', { version, expandAll });

function setAll(value: boolean) {
  expandAll.value = value;
  version.value += 1;
}
</script>

<template>
  <div class="flex flex-col gap-8px">
    <div class="flex justify-end gap-12px">
      <NButton text type="primary" size="tiny" @click="setAll(true)">{{ $t('common.expandAll') }}</NButton>
      <NButton text type="primary" size="tiny" @click="setAll(false)">{{ $t('common.collapseAll') }}</NButton>
    </div>
    <JsonNode :value="value" :depth="0" :collapse-depth="props.collapseDepth" :comma="false" :show-key="false" />
  </div>
</template>

<style scoped></style>
