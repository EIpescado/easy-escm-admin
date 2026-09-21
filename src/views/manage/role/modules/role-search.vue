<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'RoleSearch'
});

interface Emits {
  (e: 'search'): void;
  (e: 'reset'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.RoleSearchModel>('model', { required: true });
</script>

<template>
  <NCard :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" :show-feedback="false">
      <NGrid responsive="screen" item-responsive :x-gap="16" :y-gap="12">
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="roleCode">
            <NInput v-model:value="model.roleCode" clearable :placeholder="$t('page.manage.role.roleCode')" />
          </NFormItem>
        </NGi>
        <NGi span="24 s:12 m:8 l:6">
          <NFormItem path="roleName">
            <NInput v-model:value="model.roleName" clearable :placeholder="$t('page.manage.role.roleName')" />
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
