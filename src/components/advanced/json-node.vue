<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import type { Ref } from 'vue';

defineOptions({
  name: 'JsonNode'
});

interface Props {
  /** property name of the node, omitted for the root value and array items */
  name?: string | number;
  /** value of the node */
  value: unknown;
  /** nesting depth of this node */
  depth: number;
  /** nodes deeper than this are collapsed on first render */
  collapseDepth: number;
  /** whether a comma follows the node */
  comma?: boolean;
  /** whether to render the property name */
  showKey?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  comma: false,
  showKey: true
});

/** expand / collapse all is driven by the viewer */
const control = inject<{ version: Ref<number>; expandAll: Ref<boolean> } | null>('json-viewer-control', null);

const expanded = ref(props.depth < props.collapseDepth);

if (control) {
  watch(control.version, () => {
    expanded.value = control.expandAll.value;
  });
}

const isObject = computed(() => props.value !== null && typeof props.value === 'object');

const isArray = computed(() => Array.isArray(props.value));

interface Entry {
  key: string | number;
  value: unknown;
}

const entries = computed<Entry[]>(() => {
  if (!isObject.value) return [];

  if (isArray.value) {
    return (props.value as unknown[]).map((item, index) => ({ key: index, value: item }));
  }

  return Object.entries(props.value as Record<string, unknown>).map(([key, value]) => ({ key, value }));
});

const openBracket = computed(() => (isArray.value ? '[' : '{'));
const closeBracket = computed(() => (isArray.value ? ']' : '}'));

/** color of a primitive value */
function valueClass(value: unknown) {
  if (value === null || value === undefined) return 'text-gray-400';
  if (typeof value === 'string') return 'text-green-600 dark:text-green-400';
  if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
  if (typeof value === 'boolean') return 'text-orange-600 dark:text-orange-400';

  return 'text-gray-500';
}

/** JSON literal of a primitive value */
function formatValue(value: unknown) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === undefined) return 'null';

  return String(value);
}
</script>

<template>
  <div class="font-mono text-13px leading-22px">
    <template v-if="isObject">
      <span v-if="showKey" class="text-#646cff dark:text-#a8a8ff">&quot;{{ name }}&quot;</span>
      <span v-if="showKey" class="text-gray-500">:</span>
      <span
        class="cursor-pointer select-none text-gray-400 hover:text-#646cff"
        :title="expanded ? 'collapse' : 'expand'"
        @click="expanded = !expanded"
      >
        {{ expanded ? '▾' : '▸' }}
      </span>
      <span class="text-gray-500">{{ openBracket }}</span>
      <template v-if="expanded">
        <div v-for="(entry, index) in entries" :key="entry.key" class="pl-16px">
          <JsonNode
            :name="entry.key"
            :value="entry.value"
            :depth="depth + 1"
            :collapse-depth="collapseDepth"
            :comma="index < entries.length - 1"
            :show-key="!isArray"
          />
        </div>
        <span class="text-gray-500">{{ closeBracket }}</span>
      </template>
      <template v-else>
        <span class="text-gray-400">… {{ entries.length }}</span>
        <span class="text-gray-500">{{ closeBracket }}</span>
      </template>
      <span v-if="comma" class="text-gray-500">,</span>
    </template>
    <template v-else>
      <span v-if="showKey" class="text-#646cff dark:text-#a8a8ff">&quot;{{ name }}&quot;</span>
      <span v-if="showKey" class="text-gray-500">:</span>
      <span :class="valueClass(value)">{{ formatValue(value) }}</span>
      <span v-if="comma" class="text-gray-500">,</span>
    </template>
  </div>
</template>

<style scoped></style>
