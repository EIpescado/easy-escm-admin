<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'OrgName'
});

const authStore = useAuthStore();

const orgName = computed(() => authStore.userInfo.org.name);
</script>

<template>
  <NTooltip v-if="orgName" trigger="hover">
    <template #trigger>
      <div class="mr-10px flex-y-center gap-6px rounded-6px bg-primary bg-opacity-10 px-10px py-4px lt-sm:hidden">
        <SvgIcon icon="mdi:office-building" class="text-16px text-primary" />
        <span class="max-w-160px truncate text-14px text-primary font-medium">{{ orgName }}</span>
      </div>
    </template>
    {{ orgName }}
  </NTooltip>
</template>

<style scoped></style>
