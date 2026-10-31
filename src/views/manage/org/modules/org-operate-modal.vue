<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateOrg, fetchOrgDetail, fetchUpdateOrg } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'OrgOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.Org | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

interface OrgModel {
  id?: string;
  code: string;
  name: string;
  state: string;
  remark: string;
}

function createEmptyModel(): OrgModel {
  return {
    id: undefined,
    code: '',
    name: '',
    state: 'ON',
    remark: ''
  };
}

const model = reactive<OrgModel>(createEmptyModel());

/** the edit detail is being loaded */
const loading = ref(false);

/** increments on every open, drops a detail response of a superseded open */
let detailToken = 0;

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.org.createTitle' : 'page.manage.org.editTitle')
);

const rules: FormRules = {
  code: defaultRequiredRule,
  name: defaultRequiredRule
};

function fillFrom(detail: Api.SystemManage.Org) {
  Object.assign(model, {
    id: detail.id,
    code: detail.code ?? '',
    name: detail.name ?? '',
    state: detail.stateEnum ?? 'ON',
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

    const { data, error } = await fetchOrgDetail(props.row.id);

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
  const payload: Api.SystemManage.OrgForm = {
    id: model.id,
    code: model.code.trim(),
    name: model.name.trim(),
    state: model.state,
    remark: model.remark || undefined
  };

  const { error } = props.operateType === 'add' ? await fetchCreateOrg(payload) : await fetchUpdateOrg(payload);

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
        <FormLabel :label="$t('page.manage.org.code')" :tip="$t('page.manage.org.codeTip')" />
      </template>
      <NInput v-model:value="model.code" :placeholder="$t('page.manage.org.codePlaceholder')" />
    </NFormItem>
    <NFormItem path="name">
      <template #label>
        <FormLabel :label="$t('page.manage.org.name')" />
      </template>
      <NInput v-model:value="model.name" :placeholder="$t('page.manage.org.name')" />
    </NFormItem>
    <NFormItem path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.org.remark')" />
      </template>
      <NInput v-model:value="model.remark" :placeholder="$t('page.manage.org.remark')" />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
