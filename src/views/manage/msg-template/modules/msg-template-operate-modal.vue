<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateMsgTemplate, fetchDictSelect, fetchMsgTemplateDetail, fetchUpdateMsgTemplate } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'MsgTemplateOperateModal'
});

/** dictionaries used by the template type and its entries */
const DICT_TEMPLATE_TYPE = 'system_msg_template_type';
const DICT_ENTRY_TYPE = 'system_msg_template_entry_type';

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.MsgTemplate | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** template type options */
const typeOptions = ref<Api.SystemManage.DictEntry[]>([]);
/** entry type options */
const entryTypeOptions = ref<Api.SystemManage.DictEntry[]>([]);

const templateTypeSelectOptions = computed(() =>
  typeOptions.value.map(entry => ({ label: entry.val || entry.code, value: entry.code }))
);

const entryTypeSelectOptions = computed(() =>
  entryTypeOptions.value.map(entry => ({ label: entry.val || entry.code, value: entry.code }))
);

async function loadDictOptions() {
  if (!typeOptions.value.length) {
    const { data } = await fetchDictSelect(DICT_TEMPLATE_TYPE);
    typeOptions.value = data ?? [];
  }

  if (!entryTypeOptions.value.length) {
    const { data } = await fetchDictSelect(DICT_ENTRY_TYPE);
    entryTypeOptions.value = data ?? [];
  }
}

interface TemplateModel {
  id?: string;
  code: string;
  type: string | null;
  sn: number | null;
  title: string;
  titleDesc: string;
  subTitle: string;
  subTitleDesc: string;
  whetherConfirm: boolean;
  hidden: boolean;
  remark: string;
  remarkDesc: string;
}

function createEmptyModel(): TemplateModel {
  return {
    id: undefined,
    code: '',
    type: null,
    sn: 1,
    title: '',
    titleDesc: '',
    subTitle: '',
    subTitleDesc: '',
    whetherConfirm: false,
    hidden: false,
    remark: '',
    remarkDesc: ''
  };
}

const model = reactive<TemplateModel>(createEmptyModel());

/** template entries, edited with the built-in dynamic input */
const entries = ref<Api.SystemManage.MsgTemplateEntry[]>([]);

/** the edit detail (with the entries) is being loaded */
const loading = ref(false);

/** increments on every open, drops a detail response of a superseded open */
let detailToken = 0;

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.msgTemplate.createTitle' : 'page.manage.msgTemplate.editTitle')
);

const rules: FormRules = {
  code: defaultRequiredRule,
  type: defaultRequiredRule,
  sn: defaultRequiredRule,
  title: defaultRequiredRule
};

/** new entry of the dynamic input */
function createEntry(): Api.SystemManage.MsgTemplateEntry {
  return {
    sn: entries.value.length + 1,
    type: null,
    label: '',
    labelDesc: '',
    val: '',
    prop: '',
    color: ''
  };
}

function resetForm() {
  Object.assign(model, createEmptyModel());
  entries.value = [];
}

function fillFrom(detail: Api.SystemManage.MsgTemplate) {
  Object.assign(model, {
    id: detail.id,
    code: detail.code ?? '',
    type: detail.type ?? null,
    sn: detail.sn ?? 1,
    title: detail.title ?? '',
    titleDesc: detail.titleDesc ?? '',
    subTitle: detail.subTitle ?? '',
    subTitleDesc: detail.subTitleDesc ?? '',
    whetherConfirm: Boolean(detail.whetherConfirm),
    hidden: Boolean(detail.hidden),
    remark: detail.remark ?? '',
    remarkDesc: detail.remarkDesc ?? ''
  });

  entries.value = (detail.entryList ?? []).map(entry => ({ ...entry }));
}

watch(visible, async val => {
  if (!val) return;

  restoreValidation();
  resetForm();
  loadDictOptions();

  const token = ++detailToken;

  if (props.operateType === 'edit' && props.row) {
    loading.value = true;

    const { data, error } = await fetchMsgTemplateDetail(props.row.id);

    // ignore the response when the dialog was closed or reopened meanwhile
    if (token !== detailToken || !visible.value) return;

    if (!error && data) {
      fillFrom(data);
    }

    loading.value = false;
  } else {
    loading.value = false;
  }
});

async function handleSubmit() {
  const entryList = entries.value
    .filter(entry => (entry.label ?? '').trim() || (entry.prop ?? '').trim())
    .map(entry => ({ ...entry }));

  const payload: Api.SystemManage.MsgTemplateForm = {
    id: model.id,
    code: model.code.trim(),
    type: model.type,
    sn: model.sn,
    title: model.title.trim(),
    titleDesc: model.titleDesc || undefined,
    subTitle: model.subTitle || undefined,
    subTitleDesc: model.subTitleDesc || undefined,
    whetherConfirm: model.whetherConfirm,
    hidden: model.hidden,
    remark: model.remark || undefined,
    remarkDesc: model.remarkDesc || undefined,
    entryList
  };

  const { error } =
    props.operateType === 'add' ? await fetchCreateMsgTemplate(payload) : await fetchUpdateMsgTemplate(payload);

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
    :loading="loading"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NFormItem path="code">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.code')" />
      </template>
      <NInput v-model:value="model.code" :placeholder="$t('page.manage.msgTemplate.code')" />
    </NFormItem>
    <NFormItem path="type">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.type')" />
      </template>
      <NSelect
        v-model:value="model.type"
        :options="templateTypeSelectOptions"
        :placeholder="$t('page.manage.msgTemplate.typePlaceholder')"
        tag
        filterable
        clearable
      />
    </NFormItem>
    <NFormItem path="sn">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.sn')" />
      </template>
      <NInputNumber v-model:value="model.sn" :min="0" class="w-full" />
    </NFormItem>
    <NFormItem path="title">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.title')" />
      </template>
      <NInput v-model:value="model.title" :placeholder="$t('page.manage.msgTemplate.title')" />
    </NFormItem>
    <NFormItem path="titleDesc">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.titleDesc')" />
      </template>
      <NInput v-model:value="model.titleDesc" :placeholder="$t('page.manage.msgTemplate.titleDesc')" />
    </NFormItem>
    <NFormItem path="subTitle">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.subTitle')" />
      </template>
      <NInput v-model:value="model.subTitle" :placeholder="$t('page.manage.msgTemplate.subTitle')" />
    </NFormItem>
    <NFormItem path="subTitleDesc">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.subTitleDesc')" />
      </template>
      <NInput v-model:value="model.subTitleDesc" :placeholder="$t('page.manage.msgTemplate.subTitleDesc')" />
    </NFormItem>
    <NFormItem path="whetherConfirm">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.whetherConfirm')" />
      </template>
      <NRadioGroup v-model:value="model.whetherConfirm">
        <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
        <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
      </NRadioGroup>
    </NFormItem>
    <NFormItem path="hidden">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.hidden')" />
      </template>
      <NRadioGroup v-model:value="model.hidden">
        <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
        <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
      </NRadioGroup>
    </NFormItem>
    <NFormItem path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.remark')" />
      </template>
      <NInput v-model:value="model.remark" :placeholder="$t('page.manage.msgTemplate.remark')" />
    </NFormItem>
    <NFormItem path="remarkDesc">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.remarkDesc')" />
      </template>
      <NInput v-model:value="model.remarkDesc" :placeholder="$t('page.manage.msgTemplate.remarkDesc')" />
    </NFormItem>
    <NFormItem class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.msgTemplate.entries')" />
      </template>
      <NDynamicInput v-model:value="entries" :on-create="createEntry">
        <template #default="{ value }">
          <div class="w-full flex flex-col gap-8px">
            <div class="w-full flex items-center gap-8px">
              <NInputNumber
                v-model:value="value.sn"
                :min="0"
                :placeholder="$t('page.manage.msgTemplate.entrySn')"
                class="w-100px shrink-0"
              />
              <NSelect
                v-model:value="value.type"
                :options="entryTypeSelectOptions"
                :placeholder="$t('page.manage.msgTemplate.entryTypePlaceholder')"
                class="w-150px shrink-0"
                tag
                filterable
                clearable
              />
              <NInput
                v-model:value="value.label"
                :placeholder="$t('page.manage.msgTemplate.entryLabel')"
                class="min-w-0 flex-1"
              />
              <NInput
                v-model:value="value.prop"
                :placeholder="$t('page.manage.msgTemplate.entryProp')"
                class="min-w-0 flex-1"
              />
            </div>
            <div class="w-full flex items-center gap-8px">
              <NInput
                v-model:value="value.val"
                :placeholder="$t('page.manage.msgTemplate.entryVal')"
                class="min-w-0 flex-1"
              />
              <NInput
                v-model:value="value.labelDesc"
                :placeholder="$t('page.manage.msgTemplate.entryLabelDesc')"
                class="min-w-0 flex-1"
              />
              <div class="w-120px shrink-0">
                <NInput v-model:value="value.color" :placeholder="$t('page.manage.msgTemplate.entryColor')" />
              </div>
            </div>
          </div>
        </template>
      </NDynamicInput>
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
