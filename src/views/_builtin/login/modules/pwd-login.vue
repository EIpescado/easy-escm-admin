<script setup lang="ts">
import { computed, reactive } from 'vue';
import { loginModuleRecord } from '@/constants/app';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  username: string;
  password: string;
}

const model: FormModel = reactive({
  username: '',
  password: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    username: formRules.username,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login(model.username, model.password);
}

interface ThirdPartyLogin {
  key: string;
  icon: string;
  color: string;
  module: UnionKey.LoginModule;
}

const thirdPartyLogins: ThirdPartyLogin[] = [
  {
    key: 'wechat',
    icon: 'mdi:wechat',
    color: 'text-#07c160',
    module: 'bind-wechat'
  }
];
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="username">
      <NInput v-model:value="model.username" :placeholder="$t('page.login.common.usernamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NSpace vertical :size="24">
      <div class="flex-y-center justify-between">
        <NCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <div class="flex-y-center justify-between gap-12px">
        <NButton class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>
        <NButton class="flex-1" block @click="toggleLoginModule('register')">
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
      <NDivider class="text-14px text-#666 !m-0">{{ $t('page.login.pwdLogin.otherLoginMode') }}</NDivider>
      <div class="flex-center gap-16px">
        <NButton
          v-for="item in thirdPartyLogins"
          :key="item.key"
          circle
          size="large"
          @click="toggleLoginModule(item.module)"
        >
          <SvgIcon :icon="item.icon" class="text-22px" :class="item.color" />
        </NButton>
      </div>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
