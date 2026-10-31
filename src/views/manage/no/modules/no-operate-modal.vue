<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateNoRule, fetchNoRuleDetail, fetchUpdateNoRule } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'NoOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.NoRule | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** the form keeps the sequence number as a string, the backend Long is returned as one */
interface NoModel {
  id?: string;
  docType: string;
  currentNo: string;
  prefix: string;
  format: string;
  template: string;
  bit: number | null;
  batchNumber: number | null;
  remark: string;
}

function createEmptyModel(): NoModel {
  return {
    id: undefined,
    docType: '',
    currentNo: '0',
    prefix: '',
    format: 'yyMMdd',
    template: '',
    bit: 4,
    batchNumber: 10,
    remark: ''
  };
}

const model = reactive<NoModel>(createEmptyModel());

/** the edit detail is being loaded */
const loading = ref(false);

/** increments on every open, drops a detail response of a superseded open */
let detailToken = 0;

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.no.createTitle' : 'page.manage.no.editTitle')
);

const rules: FormRules = {
  docType: defaultRequiredRule,
  bit: defaultRequiredRule,
  batchNumber: defaultRequiredRule
};

function fillFrom(detail: Api.SystemManage.NoRule) {
  Object.assign(model, {
    id: detail.id,
    docType: detail.docType ?? '',
    currentNo: detail.currentNo != null ? String(detail.currentNo) : '0',
    prefix: detail.prefix ?? '',
    format: detail.format ?? '',
    template: detail.template ?? '',
    bit: detail.bit ?? 4,
    batchNumber: detail.batchNumber ?? 10,
    remark: detail.remark ?? ''
  });
}

watch(visible, async val => {
  if (!val) return;

  restoreValidation();
  Object.assign(model, createEmptyModel());

  const token = ++detailToken;

  if (props.operateType === 'edit' && props.row) {
    loading.value = true;

    // the list To has no `template`, so take the full rule from the detail endpoint
    const { data, error } = await fetchNoRuleDetail(props.row.id);

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
  const payload: Api.SystemManage.NoRuleForm = {
    id: model.id,
    docType: model.docType.trim(),
    currentNo: model.currentNo.trim() || '0',
    prefix: model.prefix.trim() || undefined,
    format: model.format.trim() || undefined,
    template: model.template.trim() || undefined,
    bit: model.bit,
    batchNumber: model.batchNumber,
    remark: model.remark || undefined
  };

  const { error } = props.operateType === 'add' ? await fetchCreateNoRule(payload) : await fetchUpdateNoRule(payload);

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
    <NFormItem path="docType">
      <template #label>
        <FormLabel :label="$t('page.manage.no.docType')" :tip="$t('page.manage.no.docTypeTip')" />
      </template>
      <NInput v-model:value="model.docType" :placeholder="$t('page.manage.no.docTypePlaceholder')" />
    </NFormItem>
    <NFormItem path="prefix">
      <template #label>
        <FormLabel :label="$t('page.manage.no.prefix')" />
      </template>
      <NInput v-model:value="model.prefix" :placeholder="$t('page.manage.no.prefix')" />
    </NFormItem>
    <NFormItem path="format">
      <template #label>
        <FormLabel :label="$t('page.manage.no.format')" :tip="$t('page.manage.no.formatTip')" />
      </template>
      <NInput v-model:value="model.format" :placeholder="$t('page.manage.no.formatPlaceholder')" />
    </NFormItem>
    <NFormItem path="template">
      <template #label>
        <FormLabel :label="$t('page.manage.no.template')" :tip="$t('page.manage.no.templateTip')" />
      </template>
      <NInput v-model:value="model.template" placeholder="{prefix}{time}{seq}" />
    </NFormItem>
    <NFormItem path="currentNo">
      <template #label>
        <FormLabel :label="$t('page.manage.no.currentNo')" :tip="$t('page.manage.no.currentNoTip')" />
      </template>
      <NInput v-model:value="model.currentNo" :placeholder="$t('page.manage.no.currentNo')" />
    </NFormItem>
    <NFormItem path="bit">
      <template #label>
        <FormLabel :label="$t('page.manage.no.bit')" :tip="$t('page.manage.no.bitTip')" />
      </template>
      <NInputNumber v-model:value="model.bit" :min="1" :max="20" class="w-full" />
    </NFormItem>
    <NFormItem path="batchNumber">
      <template #label>
        <FormLabel :label="$t('page.manage.no.batchNumber')" :tip="$t('page.manage.no.batchNumberTip')" />
      </template>
      <NInputNumber v-model:value="model.batchNumber" :min="1" class="w-full" />
    </NFormItem>
    <NFormItem path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.no.remark')" />
      </template>
      <NInput v-model:value="model.remark" :placeholder="$t('page.manage.no.remark')" />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
