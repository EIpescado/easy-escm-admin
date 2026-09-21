<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'TableHeaderOperation'
});

interface Props {
  itemAlign?: NaiveUI.Align;
  disabledDelete?: boolean;
  loading?: boolean;
}

defineProps<Props>();

interface Emits {
  (e: 'add'): void;
  (e: 'delete'): void;
  (e: 'refresh'): void;
}

const emit = defineEmits<Emits>();

const columns = defineModel<NaiveUI.TableColumnCheck[]>('columns', {
  default: () => []
});

function add() {
  emit('add');
}

function batchDelete() {
  emit('delete');
}

function refresh() {
  emit('refresh');
}
</script>

<template>
  <div class="flex items-center justify-between gap-8px">
    <NSpace :align="itemAlign" wrap>
      <slot name="default">
        <NButton size="small" ghost type="primary" @click="add">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="batchDelete">
          <template #trigger>
            <NButton size="small" ghost type="error" :disabled="disabledDelete">
              <template #icon>
                <icon-ic-round-delete class="text-icon" />
              </template>
              {{ $t('common.batchDelete') }}
            </NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </slot>
    </NSpace>
    <NSpace :align="itemAlign" wrap justify="end">
      <slot name="prefix"></slot>
      <NButton size="small" @click="refresh">
        <template #icon>
          <icon-mdi-refresh class="text-icon" :class="{ 'animate-spin': loading }" />
        </template>
        {{ $t('common.refresh') }}
      </NButton>
      <TableColumnSetting v-model:columns="columns" />
      <slot name="suffix"></slot>
    </NSpace>
  </div>
</template>

<style scoped></style>
