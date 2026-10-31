<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { VNodeChild } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useDebounceFn } from '@vueuse/core';
import { fetchPageSearch } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'RemoteSelect'
});

/** option of the select, the extra fields are kept for a custom label renderer */
interface RemoteSelectOption extends SelectOption {
  label: string;
  value: string;
  roleCode?: string;
  remark?: string | null;
}

type RemoteSource = 'dict' | 'user' | 'role';

interface Props {
  /** where the options come from */
  source: RemoteSource;
  /** dictionary code, required when `source` is `dict` */
  dictCode?: string;
  multiple?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** control size, matches `NSelect` */
  size?: 'small' | 'medium' | 'large';
  /** whether the select is bordered, matches `NSelect` */
  bordered?: boolean;
  /** the label of the current value, shown before its page is loaded (e.g. while editing) */
  fallbackOption?: { label: string; value: string } | null;
  /** custom label renderer, receives the option (with `roleCode` / `remark` for roles) */
  renderLabel?: (option: SelectOption, selected: boolean) => VNodeChild;
  /** keyword search delay in ms, defaults to 300 */
  debounce?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dictCode: '',
  multiple: false,
  clearable: true,
  disabled: false,
  placeholder: '',
  size: 'medium',
  bordered: true,
  fallbackOption: null,
  renderLabel: undefined,
  debounce: 300
});

const model = defineModel<string | string[] | null>('value', { default: null });

/** options fetched per page */
const PAGE_SIZE = 20;

/** how close to the bottom (in px) the next page starts loading */
const SCROLL_THRESHOLD = 24;

const options = ref<RemoteSelectOption[]>([]);
const loading = ref(false);
const page = ref(0);
const hasMore = ref(true);

/** current keyword, driven by the select search */
let keyword = '';

/** the current selection is always selectable, even when it is not part of the loaded page */
const mergedOptions = computed(() => {
  const fallback = props.fallbackOption;
  const selected = Array.isArray(model.value) ? model.value : model.value ? [model.value] : [];

  const missing = selected.filter(value => !options.value.some(option => option.value === value));

  if (!missing.length) return options.value;

  const extra: RemoteSelectOption[] = missing.map(value => ({
    label: value === fallback?.value ? fallback.label : value,
    value
  }));

  return [...extra, ...options.value];
});

/** loading row appended to the loaded options while the next page is fetched */
const LOADING_VALUE = '__remote_loading__';

/** what the dropdown renders: the options, plus a loading row while a page is in flight */
const displayOptions = computed<RemoteSelectOption[]>(() => {
  if (!loading.value || !options.value.length) return mergedOptions.value;

  return [...mergedOptions.value, { label: $t('common.loading'), value: LOADING_VALUE, disabled: true }];
});

/** dictionary id by code, resolved once per session */
const dictIdCache = new Map<string, string>();

async function resolveDictId(code: string) {
  const cached = dictIdCache.get(code);

  if (cached) return cached;

  const { data, error } = await fetchPageSearch<Api.SystemManage.Dict>('/system/dict/search', {
    page: 1,
    size: 1,
    items: [{ prop: 'code', type: 'eq', values: [code] }],
    orders: []
  });

  const id = data?.rows?.[0]?.id;

  if (error || !id) return null;

  dictIdCache.set(code, id);

  return id;
}

/** build the keyword items of a dynamic query: `fast` items are OR-ed by the backend */
function keywordItems(properties: string[]): Api.SystemManage.QueryItem[] {
  if (!keyword) return [];

  return properties.map(prop => ({ prop, type: 'like' as const, values: [keyword], fast: true }));
}

interface FetchResult {
  rows: RemoteSelectOption[];
  total: number;
}

/** fetch one page of options of the configured source */
async function fetchOptions(current: number): Promise<FetchResult> {
  const empty = { rows: [], total: 0 };

  if (props.source === 'dict') {
    const dictId = await resolveDictId(props.dictCode);

    if (!dictId) return empty;

    const { data, error } = await fetchPageSearch<Api.SystemManage.DictEntry>('/system/dictEntry/search', {
      page: current,
      size: PAGE_SIZE,
      items: [{ prop: 'pid', type: 'eq', values: [dictId] }, ...keywordItems(['code', 'val'])],
      orders: []
    });

    if (error || !data) return empty;

    return {
      rows: data.rows.map(entry => ({ label: entry.val || entry.code, value: entry.code })),
      total: Number(data.total)
    };
  }

  if (props.source === 'user') {
    const { data, error } = await fetchPageSearch<Api.SystemManage.User>('/system/user/search', {
      page: current,
      size: PAGE_SIZE,
      items: keywordItems(['username', 'nickname']),
      orders: []
    });

    if (error || !data) return empty;

    return {
      rows: data.rows.map(user => ({ label: user.nickname || user.username, value: user.id })),
      total: Number(data.total)
    };
  }

  const { data, error } = await fetchPageSearch<Api.SystemManage.Role>('/system/role/search', {
    page: current,
    size: PAGE_SIZE,
    items: keywordItems(['roleCode', 'roleName']),
    orders: []
  });

  if (error || !data) return empty;

  return {
    rows: data.rows.map(role => ({
      label: role.roleName,
      value: String(role.id),
      roleCode: role.roleCode,
      remark: role.remark
    })),
    total: Number(data.total)
  };
}

/** load a page, appending it unless `reset` (keyword changed or the select was reopened) */
async function load(reset: boolean) {
  if (loading.value) return;

  const next = reset ? 1 : page.value + 1;

  loading.value = true;

  try {
    const { rows, total } = await fetchOptions(next);

    options.value = reset ? rows : [...options.value, ...rows];
    page.value = next;
    hasMore.value = options.value.length < total && rows.length > 0;
  } finally {
    loading.value = false;
  }
}

/** first load, on open */
function handleFocus() {
  if (!options.value.length) load(true);
}

/** keyword search, the backend does the filtering; the delay is configurable, 300ms by default */
const handleSearch = useDebounceFn((value: string) => {
  keyword = value.trim();
  load(true);
}, props.debounce);

/** infinite loading of the following pages */
function handleScroll(event: Event) {
  if (!hasMore.value || loading.value) return;

  const el = event.target as HTMLElement | null;

  if (!el) return;

  if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD) {
    load(false);
  }
}

// a different dictionary must drop the cached options
watch(
  () => props.dictCode,
  () => {
    options.value = [];
    page.value = 0;
    hasMore.value = true;
    keyword = '';
  }
);

// load the first page eagerly, so the label of the current value resolves without opening the menu
onMounted(() => load(true));
</script>

<template>
  <NSelect
    v-model:value="model"
    :options="displayOptions"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    :placeholder="placeholder"
    :loading="loading"
    :size="size"
    :bordered="bordered"
    :render-label="renderLabel"
    filterable
    remote
    @focus="handleFocus"
    @search="handleSearch"
    @scroll="handleScroll"
  >
    <template #empty>
      <div class="flex items-center justify-center gap-8px py-10px text-13px text-gray-400">
        <NSpin v-if="loading" :size="14" />
        <span>{{ loading ? $t('common.loading') : $t('common.noData') }}</span>
      </div>
    </template>
  </NSelect>
</template>

<style scoped></style>
