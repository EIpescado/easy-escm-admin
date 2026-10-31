<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateThird, fetchUpdateThird } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { CHANNEL_CONFIG_FIELDS } from '@/constants/third-config';
import RemoteSelect from '@/components/advanced/remote-select.vue';

defineOptions({
  name: 'ThirdOperateModal'
});

/** dictionary holding the third-party channel types */
const DICT_THIRD_TYPE = 'system_third_type';

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.ThirdChannel | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** label of the selected type, so an edit shows it before the remote page arrives */
const typeFallback = computed(() =>
  props.row?.type ? { label: props.row.typeVal || props.row.type, value: props.row.type } : null
);

interface ThirdModel {
  id?: string;
  type: string | null;
  name: string;
  /** raw config, only used when the type has no preset form */
  config: string;
  state: string;
  remark: string;
}

function createEmptyModel(): ThirdModel {
  return {
    id: undefined,
    type: null,
    name: '',
    config: '',
    state: 'ON',
    remark: ''
  };
}

const model = reactive<ThirdModel>(createEmptyModel());

/** values of the config form, keyed by the backend prop name */
const configValues = reactive<Record<string, string | number | null>>({});

/** fields of the current channel type; `undefined` for a type without a preset form */
const configFields = computed(() => (model.type ? CHANNEL_CONFIG_FIELDS[model.type] : undefined));

/** what the config area renders: pick a type / the type form / the JSON fallback */
const configMode = computed<'pending' | 'form' | 'json'>(() => {
  if (!model.type) return 'pending';

  return configFields.value ? 'form' : 'json';
});

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.third.createTitle' : 'page.manage.third.editTitle')
);

const rules: FormRules = {
  type: defaultRequiredRule,
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

  if (!fields) {
    model.config = raw ?? '';

    return;
  }

  let parsed: Record<string, unknown> = {};

  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    parsed = {};
  }

  fields.forEach(field => {
    const value = parsed[field.key];

    if (field.type === 'number') {
      configValues[field.key] = value === null || value === undefined || value === '' ? null : Number(value);
    } else {
      configValues[field.key] = value === null || value === undefined ? '' : String(value);
    }
  });
}

/** the JSON the backend expects, built from the form of the current type */
function buildConfig() {
  const fields = configFields.value;

  if (!fields) return model.config;

  const config: Record<string, string | number> = {};

  fields.forEach(field => {
    const value = configValues[field.key];

    if (value === null || value === undefined) return;
    if (typeof value === 'string' && !value.trim()) return;

    config[field.key] = field.type === 'number' ? Number(value) : String(value).trim();
  });

  return JSON.stringify(config);
}

function stringValue(key: string) {
  const value = configValues[key];

  return value === null || value === undefined ? '' : String(value);
}

function numberValue(key: string) {
  const value = configValues[key];

  if (typeof value === 'number') return value;
  if (value === null || value === undefined || value === '') return null;

  return Number(value);
}

watch(visible, val => {
  if (!val) return;

  restoreValidation();
  Object.assign(model, createEmptyModel());
  clearConfigValues();

  // the backend exposes no detail endpoint for a channel, the list row already carries every field
  if (props.operateType === 'edit' && props.row) {
    Object.assign(model, {
      id: props.row.id,
      type: props.row.type ?? null,
      name: props.row.name ?? '',
      state: props.row.stateEnum ?? 'ON',
      remark: props.row.remark ?? ''
    });

    fillConfig(props.row.config);
  }
});

// a type switch keeps the shared keys (e.g. corpId) and only fills the new ones
watch(
  () => model.type,
  () => {
    configFields.value?.forEach(field => {
      if (configValues[field.key] === undefined) {
        configValues[field.key] = field.type === 'number' ? null : '';
      }
    });
  }
);

/** pretty print the JSON config, or keep it untouched while it is not valid JSON */
function formatConfig() {
  try {
    model.config = JSON.stringify(JSON.parse(model.config), null, 2);
  } catch {
    window.$message?.warning($t('page.manage.third.invalidJson'));
  }
}

async function handleSubmit() {
  const payload: Api.SystemManage.ThirdChannelForm = {
    id: model.id,
    type: model.type ?? '',
    name: model.name.trim(),
    config: buildConfig(),
    state: model.state,
    remark: model.remark || undefined
  };

  const { error } = props.operateType === 'add' ? await fetchCreateThird(payload) : await fetchUpdateThird(payload);

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
    <NFormItem path="type">
      <template #label>
        <FormLabel :label="$t('page.manage.third.type')" />
      </template>
      <RemoteSelect
        v-model:value="model.type"
        source="dict"
        :dict-code="DICT_THIRD_TYPE"
        :fallback-option="typeFallback"
        :placeholder="$t('page.manage.third.typePlaceholder')"
      />
    </NFormItem>
    <NFormItem path="name">
      <template #label>
        <FormLabel :label="$t('page.manage.third.name')" :tip="$t('page.manage.third.nameTip')" />
      </template>
      <NInput v-model:value="model.name" :placeholder="$t('page.manage.third.namePlaceholder')" />
    </NFormItem>

    <NFormItem v-if="configMode === 'pending'" class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.third.config')" />
      </template>
      <NAlert type="info" :bordered="false">{{ $t('page.manage.third.configPendingTip') }}</NAlert>
    </NFormItem>

    <template v-else-if="configMode === 'form'">
      <NFormItem v-for="field in configFields" :key="field.key">
        <template #label>
          <FormLabel :label="$t(field.label)" :tip="field.tip ? $t(field.tip) : undefined" />
        </template>
        <NInputNumber
          v-if="field.type === 'number'"
          :value="numberValue(field.key)"
          :placeholder="$t(field.label)"
          class="w-full"
          @update:value="value => (configValues[field.key] = value)"
        />
        <NInput
          v-else
          :value="stringValue(field.key)"
          :type="field.type === 'password' ? 'password' : 'text'"
          :show-password-on="field.type === 'password' ? 'click' : undefined"
          :placeholder="$t(field.label)"
          @update:value="value => (configValues[field.key] = value)"
        />
      </NFormItem>
    </template>

    <NFormItem v-else class="col-span-2">
      <template #label>
        <div class="flex items-center gap-8px">
          <FormLabel :label="$t('page.manage.third.config')" :tip="$t('page.manage.third.configUnknownTip')" />
          <NButton text type="primary" size="tiny" @click="formatConfig">
            {{ $t('page.manage.third.formatJson') }}
          </NButton>
        </div>
      </template>
      <NInput
        v-model:value="model.config"
        type="textarea"
        :rows="8"
        placeholder='{"host":"smtp.example.com","username":"","password":""}'
        class="font-mono"
      />
    </NFormItem>

    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.third.remark')" />
      </template>
      <NInput v-model:value="model.remark" type="textarea" :rows="2" :placeholder="$t('page.manage.third.remark')" />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
