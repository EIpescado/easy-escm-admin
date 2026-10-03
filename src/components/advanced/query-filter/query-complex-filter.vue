<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useBreakpoints, useResizeObserver } from '@vueuse/core';
import { $t } from '@/locales';
import QueryValueEditor from './query-value-editor.vue';
import {
  createCondition,
  getFieldOperators,
  normalizeValues,
  QUERY_OPERATOR_ORDER,
  type QueryField,
  type QueryFilterCondition,
  type QueryOperator
} from './types';

defineOptions({
  name: 'QueryComplexFilter'
});

interface Props {
  fields: QueryField[];
  /** How many grid rows are shown before collapsing */
  collapsedRows?: number;
  /** Globally restrict the operators selectable for every field (intersected with each field's `types`) */
  operators?: QueryOperator[];
}

const props = withDefaults(defineProps<Props>(), {
  collapsedRows: 2,
  operators: () => []
});

const model = defineModel<QueryFilterCondition[]>({ required: true });

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

const breakpoints = useBreakpoints({ s: 640, l: 1280, xl: 1536 });

/** Columns per row, aligned with the responsive `span` below (NGrid breakpoints: s=640, l=1280, xl=1536) */
const columns = computed(() => {
  if (breakpoints.smaller('s').value) return 1;
  if (breakpoints.smaller('l').value) return 2;
  if (breakpoints.smaller('xl').value) return 3;

  return 4;
});

const collapsed = ref(true);

/** Field count shown in the collapsed rows */
const capacity = computed(() => columns.value * props.collapsedRows);

/** Whether some conditions are hidden behind the collapsed drawer */
const hasOverflow = computed(() => props.fields.length > capacity.value);

/** Whether the action cell can sit inline, right after the last condition */
const actionInline = computed(() => props.fields.length + 1 <= capacity.value);

const conditionMap = computed(() => new Map(model.value.map(condition => [condition.prop, condition])));

/** Pair every field with its condition */
const rows = computed(() =>
  props.fields.map(field => ({
    field,
    condition: conditionMap.value.get(field.prop) ?? createCondition(field, { type: getEffectiveType(field) })
  }))
);

/**
 * Drawer height animation
 *
 * All fields stay mounted and the wrapper clips them: the collapsed height is the bottom of the
 * rows that fit in `collapsedRows`, the expanded height is the grid's natural height.
 */
const gridRef = ref<HTMLElement | null>(null);

const fullHeight = ref(0);

/** Estimated collapsed height, avoids a flash before the first measure */
const collapsedHeight = ref(props.collapsedRows * 34 + Math.max(0, props.collapsedRows - 1) * 12);

function updateHeights() {
  const grid = gridRef.value?.querySelector<HTMLElement>('.n-grid');

  if (!grid) return;

  const children = Array.from(grid.children) as HTMLElement[];

  fullHeight.value = grid.offsetHeight;

  if (children.length <= capacity.value) {
    collapsedHeight.value = fullHeight.value;

    return;
  }

  const gridTop = grid.getBoundingClientRect().top;
  const lastCollapsedBottom = children[capacity.value - 1].getBoundingClientRect().bottom;

  collapsedHeight.value = Math.ceil(lastCollapsedBottom - gridTop);
}

const drawerStyle = computed(() => {
  if (!hasOverflow.value || !fullHeight.value) return undefined;

  return { maxHeight: `${collapsed.value ? collapsedHeight.value : fullHeight.value}px` };
});

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

onMounted(updateHeights);

useResizeObserver(gridRef, updateHeights);

watch([columns, () => props.fields], updateHeights, { flush: 'post' });

/** Keep exactly one condition per field, preserving already filled values */
function syncConditions() {
  const existing = new Map(model.value.map(condition => [condition.prop, condition]));

  const next = props.fields.map(field => {
    const condition = existing.get(field.prop);

    if (!condition) {
      return createCondition(field, { type: getEffectiveType(field) });
    }

    // if the current operator is no longer allowed (field `types` / global `operators` changed), reset it
    if (getAllowedOperators(field).includes(condition.type)) {
      return condition;
    }

    const type = getEffectiveType(field);

    return { ...condition, type, values: normalizeValues(type, condition.values) };
  });

  const same = next.length === model.value.length && next.every((condition, index) => condition === model.value[index]);

  if (!same) {
    model.value = next;
  }
}

watch([() => props.fields, () => props.operators, model], syncConditions, { immediate: true });

/** Operators allowed for a field: field-level `types` intersected with the global `operators` prop */
function getAllowedOperators(field: QueryField) {
  const fieldOperators = getFieldOperators(field);

  if (!props.operators.length) return fieldOperators;

  const allowed = fieldOperators.filter(operator => props.operators.includes(operator));

  return allowed.length ? allowed : fieldOperators;
}

/** A valid operator for the field, preferring its `defaultType` */
function getEffectiveType(field: QueryField): QueryOperator {
  const allowed = getAllowedOperators(field);

  if (field.defaultType && allowed.includes(field.defaultType)) return field.defaultType;

  return allowed[0] ?? 'eq';
}

function getOperatorOptions(field: QueryField) {
  const allowed = getAllowedOperators(field);

  return QUERY_OPERATOR_ORDER.filter(operator => allowed.includes(operator)).map(operator => ({
    label: $t(`queryFilter.operator.${operator}` as App.I18n.I18nKey),
    value: operator
  }));
}

function patch(field: QueryField, changes: Partial<QueryFilterCondition>) {
  const base = conditionMap.value.get(field.prop) ?? createCondition(field);

  model.value = model.value.map(condition => (condition.prop === field.prop ? { ...base, ...changes } : condition));
}

function handleTypeChange(field: QueryField, type: QueryOperator) {
  patch(field, { type, values: normalizeValues(type, conditionMap.value.get(field.prop)?.values ?? []) });
}

/** Throttle window (ms) to prevent the search from being triggered repeatedly by rapid clicks / Enter */
const SEARCH_THROTTLE_MS = 600;

let lastSearchTime = 0;

function handleSearch() {
  const now = Date.now();

  if (now - lastSearchTime < SEARCH_THROTTLE_MS) return;

  lastSearchTime = now;

  emit('search');
}
</script>

<template>
  <div class="flex flex-col gap-12px">
    <div v-if="!fields.length" class="text-12px text-gray-400">{{ $t('queryFilter.empty') }}</div>

    <template v-else>
      <div ref="gridRef" :class="{ 'query-drawer': hasOverflow }" :style="hasOverflow ? drawerStyle : undefined">
        <NGrid responsive="screen" item-responsive :x-gap="12" :y-gap="12">
          <NGi v-for="(row, index) in rows" :key="`${row.condition.id}-${index}`" span="24 s:12 l:8 xl:6">
            <div
              class="query-condition min-h-34px flex items-center overflow-hidden border border-#e5e7eb rounded-6px transition-colors hover:border-#d9dde3 focus-within:border-primary dark:border-#33343a dark:hover:border-#3d3d42"
            >
              <div
                class="query-prefix w-[40%] flex shrink-0 items-center gap-8px self-stretch bg-#f2f3f5 pl-10px dark:bg-#2a2a2e"
              >
                <span
                  class="min-w-0 flex-1 truncate text-13px font-600 text-gray-500 dark:text-gray-400"
                  :title="row.field.label"
                >
                  {{ row.field.label }}
                </span>
                <NSelect
                  v-if="getOperatorOptions(row.field).length > 1"
                  class="w-68px shrink-0"
                  size="small"
                  :bordered="false"
                  :consistent-menu-width="false"
                  :value="row.condition.type"
                  :options="getOperatorOptions(row.field)"
                  @update:value="value => handleTypeChange(row.field, value)"
                />
                <span
                  v-else
                  class="w-68px shrink-0 truncate text-13px text-gray-500 dark:text-gray-400"
                  :title="getOperatorOptions(row.field)[0]?.label"
                >
                  {{ getOperatorOptions(row.field)[0]?.label }}
                </span>
              </div>
              <div class="query-value min-w-0 flex flex-1 items-center">
                <QueryValueEditor
                  :field="row.field"
                  :type="row.condition.type"
                  :bordered="false"
                  :model-value="row.condition.values"
                  @update:model-value="values => patch(row.field, { values })"
                  @submit="handleSearch"
                />
              </div>
            </div>
          </NGi>

          <NGi v-if="actionInline" span="24 s:12 l:8 xl:6">
            <div class="query-actions min-h-34px flex flex-wrap items-center gap-8px">
              <NButton size="small" type="primary" class="w-1/4" @click="handleSearch">
                {{ $t('common.search') }}
              </NButton>
              <NButton size="small" class="w-1/4" @click="emit('reset')">{{ $t('common.reset') }}</NButton>
            </div>
          </NGi>
        </NGrid>
      </div>

      <NGrid v-if="!actionInline" responsive="screen" item-responsive :x-gap="12" :y-gap="12">
        <NGi span="24 s:12 l:8 xl:6">
          <div class="query-actions min-h-34px flex flex-wrap items-center gap-8px">
            <NButton v-if="hasOverflow" size="small" text type="primary" @click="toggleCollapsed">
              <template #icon>
                <icon-mdi-arrow-down-thin
                  class="text-icon transition-transform duration-300"
                  :class="{ 'rotate-180': !collapsed }"
                />
              </template>
              {{ collapsed ? $t('queryFilter.showMore') : $t('queryFilter.showLess') }}
            </NButton>
            <NButton size="small" type="primary" class="w-1/4" @click="handleSearch">
              {{ $t('common.search') }}
            </NButton>
            <NButton size="small" class="w-1/4" @click="emit('reset')">{{ $t('common.reset') }}</NButton>
          </div>
        </NGi>
      </NGrid>
    </template>
  </div>
</template>

<style scoped>
/* Drawer-like expand/collapse: all conditions stay mounted and the wrapper clips them */
.query-drawer {
  overflow: hidden;
  transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: max-height;
}

/* Field name, operator and value controls are all flat/transparent;
   the filled `.query-prefix` wrapper provides the background for the field name + operator. */
.query-condition :deep(.n-input),
.query-condition :deep(.n-input-number),
.query-condition :deep(.n-base-selection),
.query-condition :deep(.n-base-selection-label),
.query-condition :deep(.n-base-selection-tags),
.query-condition :deep(.n-dynamic-tags) {
  background-color: transparent;
}

/* Keep the operator text left-aligned: Naive adds a 12px left padding to the select input,
   which made the dropdown operator look indented compared to the static (read-only) operator. */
.query-prefix :deep(.n-base-selection-input) {
  padding-left: 0;
}
</style>
