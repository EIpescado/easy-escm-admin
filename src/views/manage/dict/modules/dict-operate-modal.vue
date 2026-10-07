<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateDict, fetchUpdateDict } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'DictOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.DictForm | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const model = reactive<Api.SystemManage.DictForm>({
  id: undefined,
  code: '',
  name: '',
  state: 'ON',
  remark: '',
  whetherAuth: false
});

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const rules: FormRules = {
  code: defaultRequiredRule,
  name: defaultRequiredRule
};

watch(visible, val => {
  if (!val) return;

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    code: props.row?.code ?? '',
    name: props.row?.name ?? '',
    state: props.row?.state ?? 'ON',
    remark: props.row?.remark ?? '',
    whetherAuth: Boolean(props.row?.whetherAuth)
  });
});

async function handleSubmit() {
  await validate();

  const { error } = props.operateType === 'add' ? await fetchCreateDict(model) : await fetchUpdateDict(model);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-560px">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      require-mark-placement="left"
      :label-width="110"
    >
      <NFormItem path="code">
        <template #label>
          <FormLabel :label="$t('page.manage.dict.code')" />
        </template>
        <NInput
          v-model:value="model.code"
          :disabled="operateType === 'edit'"
          :placeholder="$t('page.manage.dict.code')"
        />
      </NFormItem>
      <NFormItem path="name">
        <template #label>
          <FormLabel :label="$t('page.manage.dict.name')" />
        </template>
        <NInput v-model:value="model.name" :placeholder="$t('page.manage.dict.name')" />
      </NFormItem>
      <NFormItem path="whetherAuth">
        <template #label>
          <FormLabel :label="$t('page.manage.dict.whetherAuth')" />
        </template>
        <NSwitch v-model:value="model.whetherAuth" />
      </NFormItem>
      <NFormItem path="remark">
        <template #label>
          <FormLabel :label="$t('page.manage.dict.remark')" />
        </template>
        <NInput v-model:value="model.remark" type="textarea" :rows="3" :placeholder="$t('page.manage.dict.remark')" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
