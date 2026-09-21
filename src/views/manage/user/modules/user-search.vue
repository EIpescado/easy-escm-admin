<script setup lang="ts">
import { translateOptions } from '@/utils/common';
import { userStateOptions } from '@/constants/business';
import { $t } from '@/locales';

defineOptions({
  name: 'UserSearch'
});

interface Emits {
  (e: 'search'): void;
  (e: 'reset'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.UserSearchModel>('model', { required: true });

const stateOptions = translateOptions(userStateOptions);
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" :show-feedback="false">
      <NGrid responsive="screen" item-responsive :x-gap="16" :y-gap="12">
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="username">
            <NInput v-model:value="model.username" clearable :placeholder="$t('page.manage.user.username')" />
          </NFormItem>
        </NGi>
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="nickname">
            <NInput v-model:value="model.nickname" clearable :placeholder="$t('page.manage.user.nickname')" />
          </NFormItem>
        </NGi>
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="phone">
            <NInput v-model:value="model.phone" clearable :placeholder="$t('page.manage.user.phone')" />
          </NFormItem>
        </NGi>
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="state">
            <NSelect
              v-model:value="model.state"
              clearable
              :options="stateOptions"
              :placeholder="$t('page.manage.user.stateLabel')"
            />
          </NFormItem>
        </NGi>
        <NGi span="24 s:12 m:8 l:6">
          <NSpace>
            <NButton type="primary" size="small" @click="emit('search')">{{ $t('common.search') }}</NButton>
            <NButton size="small" @click="emit('reset')">{{ $t('common.reset') }}</NButton>
          </NSpace>
        </NGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>
