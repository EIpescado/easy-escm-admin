<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { createSortItem, type QueryField, type QuerySortItem } from './types';

defineOptions({
  name: 'QuerySort'
});

interface Props {
  fields: QueryField[];
}

const props = defineProps<Props>();

const model = defineModel<QuerySortItem[]>({ required: true });

/** First field that is not used by any sort item yet */
const unusedField = computed(() => {
  const used = new Set(model.value.map(item => item.prop));

  return props.fields.find(field => !used.has(field.prop)) ?? null;
});

const canAdd = computed(() => Boolean(unusedField.value));

/** Fields selectable for a row: exclude the fields used by the other rows */
function getFieldOptions(id: string) {
  const used = new Set(model.value.filter(item => item.id !== id).map(item => item.prop));

  return props.fields.filter(field => !used.has(field.prop)).map(field => ({ label: field.label, value: field.prop }));
}

const directionOptions = computed(() => [
  { label: $t('queryFilter.asc'), value: 'asc' },
  { label: $t('queryFilter.desc'), value: 'desc' }
]);

function addSort() {
  const field = unusedField.value;

  if (!field) return;

  model.value = [...model.value, createSortItem(field)];
}

function removeSort(id: string) {
  model.value = model.value.filter(item => item.id !== id);
}

function patchSort(id: string, changes: Partial<QuerySortItem>) {
  model.value = model.value.map(item => (item.id === id ? { ...item, ...changes } : item));
}
</script>

<template>
  <div class="query-sort flex flex-col items-start gap-8px">
    <div v-for="(item, index) in model" :key="item.id" class="flex items-center gap-8px">
      <span class="w-16px shrink-0 text-right text-12px text-gray-400 dark:text-gray-500">{{ index + 1 }}</span>
      <NSelect
        class="w-180px"
        size="small"
        :consistent-menu-width="false"
        :value="item.prop"
        :options="getFieldOptions(item.id)"
        :placeholder="$t('queryFilter.sortField')"
        @update:value="value => patchSort(item.id, { prop: value })"
      />
      <NSelect
        class="w-96px"
        size="small"
        :consistent-menu-width="false"
        :value="item.asc ? 'asc' : 'desc'"
        :options="directionOptions"
        @update:value="value => patchSort(item.id, { asc: value === 'asc' })"
      />
      <NButton size="small" quaternary circle type="error" @click="removeSort(item.id)">
        <template #icon>
          <icon-mdi-close />
        </template>
      </NButton>
    </div>

    <NButton size="small" dashed :disabled="!canAdd" @click="addSort">
      <template #icon>
        <icon-mdi-plus />
      </template>
      {{ $t('queryFilter.addSort') }}
    </NButton>
  </div>
</template>
