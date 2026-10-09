<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchResetUserPassword } from '@/service/api';
import { useNaiveForm } from '@/hooks/common/form';
import { REG_PWD } from '@/constants/reg';
import { $t } from '@/locales';

defineOptions({
  name: 'UserResetPasswordModal'
});

interface Props {
  userId: string;
  username?: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();

const model = reactive({
  password: '',
  confirmPassword: ''
});

/**
 * The password is mandatory and must match the password rule and the confirmation.
 */
const rules: FormRules = {
  password: [
    { required: true, message: () => $t('form.pwd.required'), trigger: ['input', 'blur'] },
    {
      validator: (_rule, value: string) => !value || REG_PWD.test(value),
      message: () => $t('form.pwd.invalid'),
      trigger: ['input', 'blur']
    }
  ],
  confirmPassword: [
    { required: true, message: () => $t('form.confirmPwd.required'), trigger: ['input', 'blur'] },
    {
      validator: (_rule, value: string) => !value || value === model.password,
      message: () => $t('form.confirmPwd.invalid'),
      trigger: ['input', 'blur']
    }
  ]
};

watch(visible, val => {
  if (!val) return;

  model.password = '';
  model.confirmPassword = '';
  restoreValidation();
});

async function handleSubmit() {
  await validate();

  const { error } = await fetchResetUserPassword(props.userId, model.password);

  if (!error) {
    window.$message?.success($t('common.updateSuccess'));
    emit('submitted');
    visible.value = false;
  }
}
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="$t('page.manage.user.resetPassword')"
    :model="model"
    :rules="rules"
  >
    <NFormItem v-if="username" class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.user.username')" />
      </template>
      <span>{{ username }}</span>
    </NFormItem>
    <NFormItem path="password">
      <template #label>
        <FormLabel :label="$t('page.manage.user.newPassword')" />
      </template>
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.manage.user.newPasswordPlaceholder')"
      />
    </NFormItem>
    <NFormItem path="confirmPassword">
      <template #label>
        <FormLabel :label="$t('page.manage.user.confirmPassword')" />
      </template>
      <NInput
        v-model:value="model.confirmPassword"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.manage.user.confirmPasswordPlaceholder')"
      />
    </NFormItem>
    <div class="col-span-2 text-12px text-gray-400">{{ $t('page.manage.user.resetPasswordTip') }}</div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </FormDialog>
</template>

<style scoped></style>
