<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { getOperatorValueKind, normalizeValues, type QueryField, type QueryOperator } from './types';

defineOptions({
  name: 'QueryValueEditor'
});

interface Props {
  field?: QueryField | null;
  type: QueryOperator;
  modelValue: string[];
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  bordered?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  field: null,
  disabled: false,
  size: 'small',
  bordered: true
});

const emit = defineEmits<{
  'update:modelValue': [values: string[]];
  /** Emitted when Enter is pressed on a text/number input, used to trigger a search */
  submit: [];
}>();

const kind = computed(() => getOperatorValueKind(props.type));

const valueType = computed(() => props.field?.valueType ?? 'text');

const options = computed(() => props.field?.options ?? []);

const placeholder = computed(() => props.field?.placeholder ?? '');

/** single date value for `NDatePicker` */
const singleDate = computed<string | null>(() => props.modelValue[0] ?? null);

/** range date value for `NDatePicker` */
const rangeDate = computed<[string, string] | null>(() => {
  const [start, end] = props.modelValue;

  return start && end ? [start, end] : null;
});

/** Date shortcuts, computed when clicked so they always stay relative to "now" */
const DATE_SHORTCUTS: { key: string; range: () => [number, number] }[] = [
  {
    key: 'today',
    range: () => {
      const now = dayjs();
      return [now.startOf('day').valueOf(), now.endOf('day').valueOf()];
    }
  },
  {
    key: 'thisWeek',
    range: () => {
      const now = dayjs();
      return [now.startOf('week').valueOf(), now.endOf('week').valueOf()];
    }
  },
  {
    key: 'thisMonth',
    range: () => {
      const now = dayjs();
      return [now.startOf('month').valueOf(), now.endOf('month').valueOf()];
    }
  },
  {
    key: 'thisYear',
    range: () => {
      const now = dayjs();
      return [now.startOf('year').valueOf(), now.endOf('year').valueOf()];
    }
  },
  {
    key: 'lastYear',
    range: () => {
      const now = dayjs().subtract(1, 'year');
      return [now.startOf('year').valueOf(), now.endOf('year').valueOf()];
    }
  },
  {
    key: 'last30Days',
    range: () => {
      const now = dayjs();
      return [now.subtract(29, 'day').startOf('day').valueOf(), now.endOf('day').valueOf()];
    }
  },
  {
    key: 'recentYear',
    range: () => {
      const now = dayjs();
      return [now.subtract(1, 'year').add(1, 'day').startOf('day').valueOf(), now.endOf('day').valueOf()];
    }
  }
];

/** Shortcuts for a date range picker (`between` / `in`) */
const rangeDateShortcuts = computed(() =>
  Object.fromEntries(
    DATE_SHORTCUTS.map(item => [$t(`queryFilter.shortcut.${item.key}` as App.I18n.I18nKey), item.range])
  )
);

/** Shortcuts for a single date picker (`eq` / `ge` / `le`), taking the period start */
const singleDateShortcuts = computed(() =>
  Object.fromEntries(
    DATE_SHORTCUTS.map(item => [$t(`queryFilter.shortcut.${item.key}` as App.I18n.I18nKey), () => item.range()[0]])
  )
);

function toNumber(value?: string) {
  if (value === undefined || value === '') return null;

  const num = Number(value);

  return Number.isNaN(num) ? null : num;
}

function update(values: string[]) {
  emit('update:modelValue', normalizeValues(props.type, values));
}

function setValue(value: string | number | null) {
  update([value === null || value === undefined ? '' : String(value)]);
}

function setValueAt(index: number, value: string | number | null) {
  const next = [...props.modelValue];

  while (next.length <= index) {
    next.push('');
  }

  next[index] = value === null || value === undefined ? '' : String(value);

  update(next);
}

function setTags(values: Array<string | number>) {
  update(values.map(String));
}

function setRangeDate(values: [string, string] | null) {
  update(values ?? []);
}

function handleEnter() {
  emit('submit');
}
</script>

<template>
  <span v-if="kind === 'none'" class="text-12px text-gray-400">--</span>

  <template v-else-if="kind === 'single'">
    <NSelect
      v-if="valueType === 'select'"
      :value="modelValue[0] ?? null"
      :options="options"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      :placeholder="placeholder"
      clearable
      class="w-full"
      @update:value="setValue"
    />
    <NDatePicker
      v-else-if="valueType === 'date'"
      :formatted-value="singleDate"
      :shortcuts="singleDateShortcuts"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      type="date"
      value-format="yyyy-MM-dd"
      clearable
      class="w-full"
      @update:formatted-value="setValue"
    />
    <NInputNumber
      v-else-if="valueType === 'number'"
      :value="toNumber(modelValue[0])"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      :placeholder="placeholder"
      clearable
      class="w-full"
      @update:value="setValue"
      @keydown.enter="handleEnter"
    />
    <NInput
      v-else
      :value="modelValue[0] ?? ''"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      :placeholder="placeholder"
      clearable
      @update:value="setValue"
      @keydown.enter="handleEnter"
    />
  </template>

  <template v-else-if="kind === 'range'">
    <NDatePicker
      v-if="valueType === 'date'"
      :formatted-value="rangeDate"
      :shortcuts="rangeDateShortcuts"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      type="daterange"
      value-format="yyyy-MM-dd"
      clearable
      class="w-full"
      @update:formatted-value="setRangeDate"
    />
    <div v-else class="w-full flex items-center gap-8px">
      <template v-if="valueType === 'number'">
        <NInputNumber
          :value="toNumber(modelValue[0])"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(0, value)"
          @keydown.enter="handleEnter"
        />
        <span class="text-gray-400">~</span>
        <NInputNumber
          :value="toNumber(modelValue[1])"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(1, value)"
          @keydown.enter="handleEnter"
        />
      </template>
      <template v-else-if="valueType === 'select'">
        <NSelect
          :value="modelValue[0] ?? null"
          :options="options"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(0, value)"
        />
        <span class="text-gray-400">~</span>
        <NSelect
          :value="modelValue[1] ?? null"
          :options="options"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(1, value)"
        />
      </template>
      <template v-else>
        <NInput
          :value="modelValue[0] ?? ''"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(0, value)"
          @keydown.enter="handleEnter"
        />
        <span class="text-gray-400">~</span>
        <NInput
          :value="modelValue[1] ?? ''"
          :disabled="disabled"
          :size="size"
          :bordered="bordered"
          :placeholder="placeholder"
          class="flex-1"
          @update:value="value => setValueAt(1, value)"
          @keydown.enter="handleEnter"
        />
      </template>
    </div>
  </template>

  <template v-else>
    <NSelect
      v-if="valueType === 'select'"
      :value="modelValue"
      :options="options"
      :disabled="disabled"
      :size="size"
      :bordered="bordered"
      :placeholder="placeholder"
      multiple
      clearable
      class="w-full"
      @update:value="setTags"
    />
    <NDynamicTags v-else :value="modelValue" :disabled="disabled" :size="size" class="w-full" @update:value="setTags" />
  </template>
</template>
