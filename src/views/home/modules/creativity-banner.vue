<script setup lang="ts">
import { $t } from '@/locales';

defineOptions({
  name: 'CreativityBanner'
});
</script>

<template>
  <NCard
    :title="$t('page.home.creativity')"
    :bordered="false"
    size="small"
    class="h-full card-wrapper"
    :header-style="{ padding: '8px 16px' }"
    :content-style="{ overflow: 'hidden', minHeight: 0 }"
  >
    <div class="h-full flex-center">
      <icon-local-banner class="text-120px text-primary lg:text-160px" />
    </div>
  </NCard>
</template>

<style scoped></style>
