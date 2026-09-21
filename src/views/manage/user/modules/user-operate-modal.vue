<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules } from 'naive-ui';
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

const roleOptions = ref<Api.SystemManage.Selector<string>[]>([]);

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const rules: FormRules = {
  username: defaultRequiredRule,
  nickname: defaultRequiredRule,
  roleIds: {
    required: true,
    type: 'array',
    message: $t('form.required'),
    trigger: ['change', 'blur']
  }
};

watch(visible, async val => {
  if (!val) return;

  const { data: roles } = await fetchRoleSelect();
  roleOptions.value = roles || [];

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    username: props.row?.username ?? '',
    nickname: props.row?.nickname ?? '',
    phone: props.row?.phone ?? '',
    mail: props.row?.mail ?? '',
    roleIds: props.row?.roleIds ? [...props.row.roleIds] : []
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
  <NModal v-model:show="visible" preset="card" :title="title" class="w-560px">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="80">
      <NFormItem :label="$t('page.manage.user.username')" path="username">
        <NInput v-model:value="model.username" :placeholder="$t('page.manage.user.username')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.user.nickname')" path="nickname">
        <NInput v-model:value="model.nickname" :placeholder="$t('page.manage.user.nickname')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.user.phone')" path="phone">
        <NInput v-model:value="model.phone" :placeholder="$t('page.manage.user.phone')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.user.mail')" path="mail">
        <NInput v-model:value="model.mail" :placeholder="$t('page.manage.user.mail')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.user.role')" path="roleIds">
        <NSelect v-model:value="model.roleIds" multiple :options="roleOptions" />
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
