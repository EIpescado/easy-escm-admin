<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({
  name: 'ProjectNews'
});

interface NewsItem {
  id: number;
  content: string;
  time: string;
}

const newses = computed<NewsItem[]>(() => [
  { id: 1, content: $t('page.home.projectNews.desc1'), time: '2021-05-28 22:22:22' },
  { id: 2, content: $t('page.home.projectNews.desc2'), time: '2021-10-27 10:24:54' },
  { id: 3, content: $t('page.home.projectNews.desc3'), time: '2021-10-31 22:43:12' },
  { id: 4, content: $t('page.home.projectNews.desc4'), time: '2021-11-03 20:33:31' },
  { id: 5, content: $t('page.home.projectNews.desc5'), time: '2021-11-07 22:45:32' }
]);
</script>

<template>
  <NCard
    :title="$t('page.home.projectNews.title')"
    :bordered="false"
    size="small"
    class="h-full card-wrapper"
    :header-style="{ padding: '8px 16px' }"
    :content-style="{ padding: 0, overflow: 'auto', minHeight: 0 }"
  >
    <template #header-extra>
      <a class="text-primary text-14px" href="javascript:;">{{ $t('page.home.projectNews.moreNews') }}</a>
    </template>
    <div
      v-for="item in newses"
      :key="item.id"
      class="h-34px flex-y-center justify-between gap-12px px-16px transition-colors hover:bg-#f5f5f5 dark:hover:bg-#2a2a2a"
    >
      <span class="min-w-0 flex-1 truncate">{{ item.content }}</span>
      <span class="shrink-0 text-#999 text-13px">{{ item.time }}</span>
    </div>
  </NCard>
</template>

<style scoped></style>
