<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateRole, fetchUpdateRole } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'RoleOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.RoleForm | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const model = reactive<Api.SystemManage.RoleForm>({
  id: undefined,
  roleCode: '',
  roleName: '',
  remark: ''
});

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const rules: FormRules = {
  roleCode: defaultRequiredRule,
  roleName: defaultRequiredRule
};

watch(visible, val => {
  if (!val) return;

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    roleCode: props.row?.roleCode ?? '',
    roleName: props.row?.roleName ?? '',
    remark: props.row?.remark ?? ''
  });
});

async function handleSubmit() {
  const { error } = props.operateType === 'add' ? await fetchCreateRole(model) : await fetchUpdateRole(model);

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
    <NFormItem path="roleCode">
      <template #label>
        <FormLabel :label="$t('page.manage.role.roleCode')" />
      </template>
      <NInput
        v-model:value="model.roleCode"
        :disabled="operateType === 'edit'"
        :placeholder="$t('page.manage.role.roleCode')"
      />
    </NFormItem>
    <NFormItem path="roleName">
      <template #label>
        <FormLabel :label="$t('page.manage.role.roleName')" />
      </template>
      <NInput v-model:value="model.roleName" :placeholder="$t('page.manage.role.roleName')" />
    </NFormItem>
    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.role.remark')" />
      </template>
      <NInput v-model:value="model.remark" type="textarea" :rows="3" :placeholder="$t('page.manage.role.remark')" />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
