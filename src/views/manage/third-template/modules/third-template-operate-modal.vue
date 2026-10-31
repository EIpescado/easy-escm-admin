<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateThirdTemplate, fetchPageSearch, fetchUpdateThirdTemplate } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { TEMPLATE_CONFIG_FIELDS } from '@/constants/third-config';

defineOptions({
  name: 'ThirdTemplateOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.ThirdTemplate | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** message templates and third-party channels the channel template can be bound to */
const templates = ref<Api.SystemManage.MsgTemplate[]>([]);
const channels = ref<Api.SystemManage.ThirdChannel[]>([]);

/** whether the channel list has been loaded, the config form depends on the channel type */
const channelsLoaded = ref(false);

const templateOptions = computed(() =>
  templates.value.map(template => ({
    label: template.title ? `${template.code} - ${template.title}` : template.code,
    value: template.id
  }))
);

const channelOptions = computed(() =>
  channels.value.map(channel => ({
    label: channel.type ? `${channel.name} (${channel.type})` : (channel.name ?? channel.id),
    value: channel.id
  }))
);

/** always refetch, the bound templates / channels change while this page stays open */
async function loadOptions() {
  const [templateResult, channelResult] = await Promise.all([
    fetchPageSearch<Api.SystemManage.MsgTemplate>('/system/msgTemplate/search', {
      page: 1,
      size: 500,
      items: [],
      orders: []
    }),
    fetchPageSearch<Api.SystemManage.ThirdChannel>('/system/third/search', {
      page: 1,
      size: 200,
      items: [],
      orders: []
    })
  ]);

  if (!templateResult.error) {
    templates.value = templateResult.data?.rows ?? [];
  }

  if (!channelResult.error) {
    channels.value = channelResult.data?.rows ?? [];
  }

  channelsLoaded.value = true;
}

interface TemplateModel {
  id?: string;
  templateId: string | null;
  thirdId: string | null;
  name: string;
  /** raw config, only used when the channel type has no preset form */
  config: string;
  state: string;
  remark: string;
}

function createEmptyModel(): TemplateModel {
  return {
    id: undefined,
    templateId: null,
    thirdId: null,
    name: '',
    config: '',
    state: 'ON',
    remark: ''
  };
}

const model = reactive<TemplateModel>(createEmptyModel());

/** values of the template config form */
const configValues = reactive<Record<string, string>>({});

/** type of the selected channel */
const selectedChannel = computed(() => channels.value.find(channel => channel.id === model.thirdId) ?? null);
const selectedType = computed(() => selectedChannel.value?.type ?? null);

/** fields of the current channel type; `undefined` for a type without template config */
const configFields = computed(() => (selectedType.value ? TEMPLATE_CONFIG_FIELDS[selectedType.value] : undefined));

/** what the config area renders: pick a channel / the type form / no config / JSON fallback */
const configMode = computed<'pending' | 'form' | 'none' | 'json'>(() => {
  if (!model.thirdId || !channelsLoaded.value) return 'pending';

  // the channel is not part of the loaded page: fall back to the raw JSON
  if (!selectedType.value) return 'json';

  return configFields.value ? 'form' : 'none';
});

/** hint of the `none` mode: the Official Account keeps its template ids in a dictionary instead */
const noConfigTip = computed(() =>
  selectedType.value === 'WX_MP'
    ? $t('page.manage.thirdTemplate.noConfigMpTip')
    : $t('page.manage.thirdTemplate.noConfigTip')
);

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.thirdTemplate.createTitle' : 'page.manage.thirdTemplate.editTitle')
);

const rules: FormRules = {
  templateId: defaultRequiredRule,
  thirdId: defaultRequiredRule,
  name: defaultRequiredRule
};

function clearConfigValues() {
  Object.keys(configValues).forEach(key => {
    Reflect.deleteProperty(configValues, key);
  });
}

/** fill the form from the stored JSON, missing keys become empty */
function fillConfig(raw: string | null | undefined) {
  const fields = configFields.value;

  if (!fields) return;

  let parsed: Record<string, unknown> = {};

  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    parsed = {};
  }

  fields.forEach(field => {
    const value = parsed[field.key];

    configValues[field.key] = value === null || value === undefined ? '' : String(value);
  });
}

/** the JSON the backend expects, built from the form of the current channel type */
function buildConfig() {
  const fields = configFields.value;

  if (!fields) return model.config;

  const config: Record<string, string> = {};

  fields.forEach(field => {
    const value = (configValues[field.key] ?? '').trim();

    if (value) config[field.key] = value;
  });

  return JSON.stringify(config);
}

/** switching the channel drops the previous channel's template config */
function handleChannelChange() {
  model.config = '';
  clearConfigValues();
}

watch(visible, val => {
  if (!val) return;

  restoreValidation();
  Object.assign(model, createEmptyModel());
  clearConfigValues();
  channelsLoaded.value = channels.value.length > 0;
  loadOptions();

  // the backend exposes no detail endpoint, the list row already carries every field
  if (props.operateType === 'edit' && props.row) {
    Object.assign(model, {
      id: props.row.id,
      templateId: props.row.templateId ?? null,
      thirdId: props.row.thirdId ?? null,
      name: props.row.name ?? '',
      config: props.row.config ?? '',
      state: props.row.state ?? 'ON',
      remark: props.row.remark ?? ''
    });
  }
});

// the config fields appear once the channel type is known (or when the channel changes)
watch(configFields, () => {
  fillConfig(model.config);
});

/** pretty print the JSON config, or keep it untouched while it is not valid JSON */
function formatConfig() {
  try {
    model.config = JSON.stringify(JSON.parse(model.config), null, 2);
  } catch {
    window.$message?.warning($t('page.manage.thirdTemplate.invalidJson'));
  }
}

async function handleSubmit() {
  const payload: Api.SystemManage.ThirdTemplateForm = {
    id: model.id,
    templateId: model.templateId,
    thirdId: model.thirdId,
    name: model.name.trim(),
    config: buildConfig(),
    state: model.state,
    remark: model.remark || undefined
  };

  const { error } =
    props.operateType === 'add' ? await fetchCreateThirdTemplate(payload) : await fetchUpdateThirdTemplate(payload);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="title"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NFormItem path="templateId">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.template')" />
      </template>
      <NSelect
        v-model:value="model.templateId"
        :options="templateOptions"
        :placeholder="$t('page.manage.thirdTemplate.templatePlaceholder')"
        filterable
        clearable
      />
    </NFormItem>
    <NFormItem path="thirdId">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.third')" />
      </template>
      <NSelect
        v-model:value="model.thirdId"
        :options="channelOptions"
        :placeholder="$t('page.manage.thirdTemplate.thirdPlaceholder')"
        filterable
        clearable
        @update:value="handleChannelChange"
      />
    </NFormItem>
    <NFormItem path="name">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.name')" :tip="$t('page.manage.thirdTemplate.nameTip')" />
      </template>
      <NInput v-model:value="model.name" :placeholder="$t('page.manage.thirdTemplate.namePlaceholder')" />
    </NFormItem>

    <NFormItem v-if="configMode === 'pending'" class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.config')" />
      </template>
      <NAlert type="info" :bordered="false">{{ $t('page.manage.thirdTemplate.configPendingTip') }}</NAlert>
    </NFormItem>

    <template v-else-if="configMode === 'form'">
      <NFormItem v-for="field in configFields" :key="field.key">
        <template #label>
          <FormLabel :label="$t(field.label)" :tip="field.tip ? $t(field.tip) : undefined" />
        </template>
        <NInput
          :value="configValues[field.key]"
          :placeholder="$t(field.label)"
          @update:value="value => (configValues[field.key] = value)"
        />
      </NFormItem>
    </template>

    <NFormItem v-else-if="configMode === 'none'" class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.config')" />
      </template>
      <NAlert type="info" :bordered="false">{{ noConfigTip }}</NAlert>
    </NFormItem>

    <NFormItem v-else class="col-span-2">
      <template #label>
        <div class="flex items-center gap-8px">
          <FormLabel :label="$t('page.manage.thirdTemplate.config')" />
          <NButton text type="primary" size="tiny" @click="formatConfig">
            {{ $t('page.manage.thirdTemplate.formatJson') }}
          </NButton>
        </div>
      </template>
      <NInput
        v-model:value="model.config"
        type="textarea"
        :rows="6"
        placeholder='{"subject":"Order {orderNo}","ftl":"default_mail.ftlh"}'
        class="font-mono"
      />
    </NFormItem>

    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.thirdTemplate.remark')" />
      </template>
      <NInput
        v-model:value="model.remark"
        type="textarea"
        :rows="2"
        :placeholder="$t('page.manage.thirdTemplate.remark')"
      />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
