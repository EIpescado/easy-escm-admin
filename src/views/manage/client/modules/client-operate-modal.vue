<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateClient, fetchUpdateClient } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'ClientOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.Client | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** OAuth grant types the backend auth strategies currently support */
const GRANT_TYPE_OPTIONS = [
  { label: 'password', value: 'password' },
  { label: 'sms', value: 'sms' }
];

/** form model; grant types are edited as tags and stored comma separated */
interface ClientModel {
  id?: string;
  clientId: string;
  clientSecret: string;
  grantType: string;
  deviceType: string;
  activeTimeout: number | null;
  timeout: number | null;
  remark: string;
}

const model = reactive<ClientModel>({
  id: undefined,
  clientId: '',
  clientSecret: '',
  grantType: '',
  deviceType: '',
  activeTimeout: -1,
  timeout: null,
  remark: ''
});

/** grant types selected in the multi select */
const grantTypes = ref<string[]>([]);

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.client.createTitle' : 'page.manage.client.editTitle')
);

const rules: FormRules = {
  clientId: defaultRequiredRule,
  clientSecret: defaultRequiredRule
};

watch(visible, val => {
  if (!val) return;

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    clientId: props.row?.clientId ?? '',
    clientSecret: props.row?.clientSecret ?? '',
    grantType: props.row?.grantType ?? '',
    deviceType: props.row?.deviceType ?? '',
    activeTimeout: props.row?.activeTimeout ?? -1,
    timeout: props.row?.timeout ?? null,
    remark: props.row?.remark ?? ''
  });

  grantTypes.value = (props.row?.grantType ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
});

async function handleSubmit() {
  model.grantType = grantTypes.value.join(',');

  const { error } = props.operateType === 'add' ? await fetchCreateClient(model) : await fetchUpdateClient(model);

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
    <NFormItem path="clientId">
      <template #label>
        <FormLabel :label="$t('page.manage.client.clientId')" />
      </template>
      <NInput v-model:value="model.clientId" :placeholder="$t('page.manage.client.clientId')" />
    </NFormItem>
    <NFormItem path="clientSecret">
      <template #label>
        <FormLabel :label="$t('page.manage.client.clientSecret')" />
      </template>
      <NInput
        v-model:value="model.clientSecret"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.manage.client.clientSecret')"
      />
    </NFormItem>
    <NFormItem path="grantType">
      <template #label>
        <FormLabel :label="$t('page.manage.client.grantType')" />
      </template>
      <NSelect
        v-model:value="grantTypes"
        multiple
        tag
        :options="GRANT_TYPE_OPTIONS"
        :placeholder="$t('page.manage.client.grantTypePlaceholder')"
      />
    </NFormItem>
    <NFormItem path="deviceType">
      <template #label>
        <FormLabel :label="$t('page.manage.client.deviceType')" />
      </template>
      <NInput v-model:value="model.deviceType" :placeholder="$t('page.manage.client.deviceType')" />
    </NFormItem>
    <NFormItem path="activeTimeout">
      <template #label>
        <FormLabel :label="$t('page.manage.client.activeTimeout')" :tip="$t('page.manage.client.activeTimeoutTip')" />
      </template>
      <NInputNumber v-model:value="model.activeTimeout" :min="-1" class="w-full" />
    </NFormItem>
    <NFormItem path="timeout">
      <template #label>
        <FormLabel :label="$t('page.manage.client.timeout')" />
      </template>
      <NInputNumber v-model:value="model.timeout" :min="-1" class="w-full" />
    </NFormItem>
    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.client.remark')" />
      </template>
      <NInput v-model:value="model.remark" type="textarea" :rows="3" :placeholder="$t('page.manage.client.remark')" />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
