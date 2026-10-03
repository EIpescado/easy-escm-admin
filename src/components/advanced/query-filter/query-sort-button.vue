<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import QuerySort from './query-sort.vue';
import type { QueryField, QuerySortItem } from './types';

defineOptions({
  name: 'QuerySortButton'
});

interface Props {
  fields: QueryField[];
}

defineProps<Props>();

const model = defineModel<QuerySortItem[]>({ required: true });

const emit = defineEmits<{
  confirm: [];
}>();

const visible = ref(false);

/** Working copy edited inside the modal, applied only on confirm */
const draft = ref<QuerySortItem[]>([]);

const count = computed(() => model.value.length);

function openModal() {
  draft.value = model.value.map(item => ({ ...item }));
  visible.value = true;
}

function handleConfirm() {
  model.value = draft.value.map(item => ({ ...item }));
  visible.value = false;

  emit('confirm');
}
</script>

<template>
  <NButton size="small" @click="openModal">
    <template #icon>
      <icon-mdi-sort class="text-icon" />
    </template>
    {{ $t('queryFilter.sort') }}
    <NTag v-if="count" class="ml-6px" :bordered="false" size="tiny" type="primary">{{ count }}</NTag>
  </NButton>

  <NModal v-model:show="visible" preset="card" :title="$t('queryFilter.sort')" style="width: 560px">
    <div class="mb-12px text-12px text-gray-400 dark:text-gray-500">{{ $t('queryFilter.sortTip') }}</div>
    <QuerySort v-model="draft" :fields="fields" />

    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton size="small" @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton size="small" type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
