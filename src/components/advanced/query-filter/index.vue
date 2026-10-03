<script setup lang="ts">
import QueryComplexFilter from './query-complex-filter.vue';
import type { QueryField, QueryFilterCondition, QueryOperator } from './types';

defineOptions({
  name: 'QueryFilter'
});

interface Props {
  fields: QueryField[];
  /** Globally restrict the operators selectable for every field (intersected with each field's `types`) */
  operators?: QueryOperator[];
}

withDefaults(defineProps<Props>(), {
  operators: () => []
});

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

const conditions = defineModel<QueryFilterCondition[]>({ required: true });

function handleReset() {
  conditions.value = [];

  emit('reset');
}
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <QueryComplexFilter
      v-model="conditions"
      :fields="fields"
      :operators="operators"
      @search="emit('search')"
      @reset="handleReset"
    />
  </NCard>
</template>
