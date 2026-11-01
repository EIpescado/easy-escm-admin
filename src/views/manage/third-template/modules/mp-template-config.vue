<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { fetchMpTemplateList, fetchMsgTemplateDetail } from '@/service/api';
import { parseMpTemplateConfig, parseMpTemplateKeys } from '@/constants/third-config';
import { $t } from '@/locales';

defineOptions({
  name: 'MpTemplateConfig'
});

interface Props {
  /** appId of the selected Official Account channel, read from its config */
  appId: string;
  /** the message template whose parameters are mapped, `null` until one is picked */
  msgTemplateId: string | null;
}

const props = defineProps<Props>();

/** the `config` JSON of the channel template */
const config = defineModel<string>('config', { default: '' });

/** keys used when the account template content is empty, so the form stays usable */
const DEFAULT_MP_KEYS = ['first', 'keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5', 'remark'];

/** template messages of the account */
const mpTemplates = ref<Api.SystemManage.MpTemplate[]>([]);
const templatesLoading = ref(false);
/** set when the account templates could not be read */
const templatesFailed = ref(false);

/** entries (parameters) of the selected message template */
const entries = ref<Api.SystemManage.MsgTemplateEntry[]>([]);

/** WeChat template message id, stored in the config */
const selectedTemplateId = ref<string | null>(null);

/** title stored with the config, shown when the account list cannot be read */
const storedTitle = ref('');

/** message parameter name → WeChat template key, `null` while the user has not picked one */
const mapping = reactive<Record<string, string | null>>({});

const selectedTemplate = computed(
  () => mpTemplates.value.find(template => template.templateId === selectedTemplateId.value) ?? null
);

const templateOptions = computed<SelectOption[]>(() => {
  const options = mpTemplates.value.map(template => ({
    label: template.title || template.templateId,
    value: template.templateId
  }));

  // keep the stored template readable when the account cannot be read or the template was removed
  if (selectedTemplateId.value && !options.some(option => option.value === selectedTemplateId.value)) {
    options.unshift({ label: storedTitle.value || selectedTemplateId.value, value: selectedTemplateId.value });
  }

  return options;
});

/** keys of the selected account template, in the order they appear in its content */
const mpKeys = computed(() => {
  const keys = parseMpTemplateKeys(selectedTemplate.value?.content);

  return keys.length ? keys : DEFAULT_MP_KEYS;
});

const keyOptions = computed<SelectOption[]>(() => mpKeys.value.map(key => ({ label: key, value: key })));

interface MappingRow {
  /** message parameter: `subTitle`, an entry prop, or `remark` */
  prop: string;
  /** key of the account template, only for the params that have no choice (`subTitle` / `remark`) */
  fixedKey?: string;
}

/** one row per message parameter: `subTitle` → `first`, entries → keywords, `remark` → `remark` */
const mappingRows = computed<MappingRow[]>(() => {
  const keys = mpKeys.value;
  const rows: MappingRow[] = [];

  if (keys.includes('first')) rows.push({ prop: 'subTitle', fixedKey: 'first' });

  entries.value.forEach(entry => {
    if (entry.prop) rows.push({ prop: entry.prop });
  });

  if (keys.includes('remark')) rows.push({ prop: 'remark', fixedKey: 'remark' });

  return rows;
});

/** drops the response of a superseded request */
let templateToken = 0;
let entryToken = 0;

async function loadTemplates() {
  const appId = props.appId.trim();
  const token = ++templateToken;

  mpTemplates.value = [];
  templatesFailed.value = false;

  if (!appId) return;

  templatesLoading.value = true;

  const { data, error } = await fetchMpTemplateList(appId);

  // ignore the response when the account changed or the dialog was closed meanwhile
  if (token !== templateToken) return;

  templatesLoading.value = false;

  if (error || !data) {
    templatesFailed.value = true;

    return;
  }

  mpTemplates.value = data;
}

async function loadEntries() {
  const templateId = props.msgTemplateId;
  const token = ++entryToken;

  entries.value = [];

  if (!templateId) return;

  const { data, error } = await fetchMsgTemplateDetail(templateId);

  if (token !== entryToken) return;

  if (!error && data) {
    entries.value = (data.entryList ?? []).filter(entry => entry.prop?.trim());
  }
}

/** the JSON the backend expects: the account template plus the parameter → key mapping */
function buildConfig() {
  if (!selectedTemplateId.value) return '';

  const result: Record<string, string> = {};

  mappingRows.value.forEach(row => {
    const key = (row.fixedKey ?? mapping[row.prop] ?? '').trim();

    if (key) result[row.prop] = key;
  });

  return JSON.stringify({
    templateId: selectedTemplateId.value,
    title: selectedTemplate.value?.title || storedTitle.value || undefined,
    mapping: result
  });
}

function emitConfig() {
  config.value = buildConfig();
}

/** the rows of the current template / message template; missing values start empty */
watch(
  mappingRows,
  rows => {
    rows.forEach(row => {
      if (row.fixedKey) {
        mapping[row.prop] = row.fixedKey;
      } else if (mapping[row.prop] === undefined) {
        mapping[row.prop] = null;
      }
    });
  },
  { immediate: true }
);

/** the config is rewritten by the parent when the dialog opens or the channel changes */
watch(
  config,
  raw => {
    const parsed = parseMpTemplateConfig(raw);

    selectedTemplateId.value = parsed?.templateId ?? null;
    storedTitle.value = parsed?.title ?? '';

    Object.keys(mapping).forEach(key => {
      Reflect.deleteProperty(mapping, key);
    });

    Object.entries(parsed?.mapping ?? {}).forEach(([key, value]) => {
      mapping[key] = value;
    });
  },
  { immediate: true }
);

watch(() => props.appId, loadTemplates, { immediate: true });
watch(() => props.msgTemplateId, loadEntries, { immediate: true });
</script>

<template>
  <div class="w-full flex flex-col gap-12px">
    <NAlert v-if="!appId" type="warning" :bordered="false">
      {{ $t('page.manage.thirdTemplate.mpNoAppId') }}
    </NAlert>

    <div class="w-full grid grid-cols-2 gap-20px">
      <!-- left: the message parameters and the key they are sent as -->
      <div class="flex flex-col gap-8px">
        <div class="text-13px font-500">{{ $t('page.manage.thirdTemplate.mpMapping') }}</div>
        <div class="text-12px text-gray-400 dark:text-gray-500">
          {{ $t('page.manage.thirdTemplate.mpMappingTip') }}
        </div>
        <template v-if="mappingRows.length">
          <div v-for="row in mappingRows" :key="row.prop" class="w-full flex items-center gap-8px">
            <NInput :value="row.prop" disabled size="small" class="shrink-0 font-mono" style="width: 96px" />
            <span v-if="row.fixedKey" class="shrink-0 font-mono text-13px text-gray-500">{{ row.fixedKey }}</span>
            <NSelect
              v-else
              v-model:value="mapping[row.prop]"
              :options="keyOptions"
              :placeholder="$t('page.manage.thirdTemplate.mpKeyPlaceholder')"
              size="small"
              clearable
              class="min-w-0 flex-1"
              @update:value="emitConfig"
            />
          </div>
        </template>
        <div v-else class="text-12px text-gray-400 dark:text-gray-500">
          {{ $t('page.manage.thirdTemplate.mpNoTemplate') }}
        </div>
      </div>

      <!-- right: the WeChat template message and the content it renders -->
      <div class="flex flex-col gap-8px">
        <div class="flex items-center gap-4px text-13px font-500">
          <span>{{ $t('page.manage.thirdTemplate.mpTemplate') }}</span>
          <NTooltip trigger="hover">
            <template #trigger>
              <icon-mdi-help-circle-outline class="shrink-0 cursor-help text-14px text-#999" />
            </template>
            <span class="max-w-260px leading-normal">{{ $t('page.manage.thirdTemplate.mpTemplateTip') }}</span>
          </NTooltip>
        </div>
        <NSelect
          v-model:value="selectedTemplateId"
          :options="templateOptions"
          :loading="templatesLoading"
          :disabled="!appId"
          :placeholder="
            mpTemplates.length
              ? $t('page.manage.thirdTemplate.mpTemplatePlaceholder')
              : $t('page.manage.thirdTemplate.mpTemplateEmpty')
          "
          filterable
          clearable
          size="small"
          @update:value="emitConfig"
        />
        <NAlert v-if="templatesFailed" type="error" :bordered="false">
          {{ $t('page.manage.thirdTemplate.mpTemplateFailed') }}
        </NAlert>
        <div class="mt-4px text-13px font-500">{{ $t('page.manage.thirdTemplate.mpContent') }}</div>
        <pre class="mp-content">{{ selectedTemplate?.content || $t('page.manage.thirdTemplate.mpContentEmpty') }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-content {
  max-height: 200px;
  margin: 0;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  background-color: #fafafc;
  font-family: var(--font-family-mono, monospace);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

/* the naive-ui card is dark, keep the preview readable there as well */
.dark .mp-content {
  border-color: #33343a;
  background-color: #2a2a2e;
}
</style>
