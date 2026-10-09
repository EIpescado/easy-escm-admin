<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import type { FormRules, SelectOption } from 'naive-ui';
import { fetchCreateUser, fetchRoleSelect, fetchUpdateUser } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'UserOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.UserForm | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const model = reactive<Api.SystemManage.UserForm>({
  id: undefined,
  username: '',
  nickname: '',
  phone: '',
  mail: '',
  roleIds: []
});

/** role option with the extra `roleCode` / `remark` fields used by the dropdown */
interface RoleSelectOption extends SelectOption {
  roleCode?: string;
  remark?: string | null;
}

const roleOptions = ref<RoleSelectOption[]>([]);

/** render the role name with its code and remark as secondary text */
function renderRoleLabel(option: SelectOption) {
  const { roleCode, remark } = option as RoleSelectOption;
  const label = String(option.label ?? '');

  const nodes = [h('span', label)];

  if (roleCode) nodes.push(h('span', { class: 'text-12px text-gray-400' }, `[${roleCode}]`));
  if (remark) nodes.push(h('span', { class: 'text-12px text-gray-400' }, `(${remark})`));

  if (nodes.length === 1) return label;

  return h('span', { class: 'inline-flex items-center gap-6px' }, nodes);
}

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

/** show the skeleton until the edit detail is loaded into `row` */
const loading = computed(() => props.operateType === 'edit' && !props.row);

const rules: FormRules = {
  username: defaultRequiredRule,
  nickname: defaultRequiredRule,
  roleIds: {
    required: true,
    type: 'array',
    message: () => $t('form.required'),
    trigger: ['change', 'blur']
  }
};

watch([visible, () => props.row], async ([val]) => {
  if (!val) return;

  if (!roleOptions.value.length) {
    const { data: roles } = await fetchRoleSelect();

    // the select returns role rows; use `id` as value and `roleName` as label
    roleOptions.value = (roles || []).map(role => ({
      label: role.roleName,
      value: String(role.id),
      roleCode: role.roleCode,
      remark: role.remark
    }));
  }

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    username: props.row?.username ?? '',
    nickname: props.row?.nickname ?? '',
    phone: props.row?.phone ?? '',
    mail: props.row?.mail ?? '',
    roleIds: props.row?.roleIds ? props.row.roleIds.map(String) : []
  });
});

async function handleSubmit() {
  await validate();

  const { error } = props.operateType === 'add' ? await fetchCreateUser(model) : await fetchUpdateUser(model);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <FormDialog ref="formRef" v-model:visible="visible" :title="title" :loading="loading" :model="model" :rules="rules">
    <NFormItem path="username">
      <template #label>
        <FormLabel :label="$t('page.manage.user.username')" />
      </template>
      <NInput v-model:value="model.username" :placeholder="$t('page.manage.user.username')" />
    </NFormItem>
    <NFormItem path="nickname">
      <template #label>
        <FormLabel :label="$t('page.manage.user.nickname')" />
      </template>
      <NInput v-model:value="model.nickname" :placeholder="$t('page.manage.user.nickname')" />
    </NFormItem>
    <NFormItem path="phone">
      <template #label>
        <FormLabel :label="$t('page.manage.user.phone')" />
      </template>
      <NInput v-model:value="model.phone" :placeholder="$t('page.manage.user.phone')" />
    </NFormItem>
    <NFormItem path="mail">
      <template #label>
        <FormLabel :label="$t('page.manage.user.mail')" />
      </template>
      <NInput v-model:value="model.mail" :placeholder="$t('page.manage.user.mail')" />
    </NFormItem>
    <NFormItem class="col-span-2" path="roleIds">
      <template #label>
        <FormLabel :label="$t('page.manage.user.role')" />
      </template>
      <NSelect v-model:value="model.roleIds" multiple :options="roleOptions" :render-label="renderRoleLabel" />
    </NFormItem>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </FormDialog>
</template>

<style scoped></style>
