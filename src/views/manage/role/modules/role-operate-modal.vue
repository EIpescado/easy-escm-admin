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

const { formRef, validate, restoreValidation } = useNaiveForm();
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
  await validate();

  const { error } = props.operateType === 'add' ? await fetchCreateRole(model) : await fetchUpdateRole(model);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-560px">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="80">
      <NFormItem :label="$t('page.manage.role.roleCode')" path="roleCode">
        <NInput
          v-model:value="model.roleCode"
          :disabled="operateType === 'edit'"
          :placeholder="$t('page.manage.role.roleCode')"
        />
      </NFormItem>
      <NFormItem :label="$t('page.manage.role.roleName')" path="roleName">
        <NInput v-model:value="model.roleName" :placeholder="$t('page.manage.role.roleName')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.role.remark')" path="remark">
        <NInput v-model:value="model.remark" type="textarea" :rows="3" :placeholder="$t('page.manage.role.remark')" />
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
