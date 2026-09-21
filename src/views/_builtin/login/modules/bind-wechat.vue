<script setup lang="ts">
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

defineOptions({
  name: 'BindWechat'
});

const { toggleLoginModule } = useRouterPush();
</script>

<template>
  <div class="flex flex-col items-center gap-16px">
    <SvgIcon icon="mdi:wechat" class="text-64px text-#07c160" />
    <NButton round block @click="toggleLoginModule('pwd-login')">
      {{ $t('page.login.common.back') }}
    </NButton>
  </div>
</template>

<style scoped></style>
