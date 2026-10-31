<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPageSearch } from '@/service/api';
import { $t } from '@/locales';
import NoticeDetailModal from '@/components/advanced/notice-detail-modal.vue';

defineOptions({
  name: 'LatestNotice'
});

/** how many notices the card shows */
const NOTICE_COUNT = 5;

const router = useRouter();

const notices = ref<Api.SystemManage.Notice[]>([]);
const loading = ref(false);

/** whether the current user may open the notice page (its menu may not be granted) */
const canOpenNoticeList = computed(() => router.hasRoute('manage_notice'));

/** the notice whose detail dialog is open */
const detailVisible = ref(false);
const detailNotice = ref<Api.SystemManage.Notice | null>(null);

/**
 * Load the newest notices
 *
 * `/system/notice/search` already filters to the notices that are effective now and visible to the
 * current organization / roles, and orders them by `onTime` descending.
 */
async function loadNotices() {
  loading.value = true;

  try {
    const { data, error } = await fetchPageSearch<Api.SystemManage.Notice>('/system/notice/search', {
      page: 1,
      size: NOTICE_COUNT,
      items: [],
      orders: []
    });

    if (!error) {
      notices.value = (data?.rows ?? []).slice(0, NOTICE_COUNT);
    }
  } finally {
    loading.value = false;
  }
}

function openNotice(notice: Api.SystemManage.Notice) {
  detailNotice.value = notice;
  detailVisible.value = true;
}

function handleMore() {
  if (canOpenNoticeList.value) {
    router.push({ name: 'manage_notice' });
  }
}

onMounted(loadNotices);
</script>

<template>
  <NCard
    :title="$t('page.home.latestNotice.title')"
    :bordered="false"
    size="small"
    class="h-full card-wrapper"
    :header-style="{ padding: '8px 16px' }"
    :content-style="{ padding: 0, overflow: 'auto', minHeight: 0 }"
  >
    <template #header-extra>
      <a v-if="canOpenNoticeList" class="text-primary text-14px" href="javascript:;" @click="handleMore">
        {{ $t('page.home.latestNotice.more') }}
      </a>
    </template>
    <div v-if="loading" class="h-full min-h-80px flex-center">
      <NSpin :size="20" />
    </div>
    <div v-else-if="!notices.length" class="py-40px text-center text-14px text-gray-400">
      {{ $t('page.home.latestNotice.empty') }}
    </div>
    <template v-else>
      <div
        v-for="item in notices"
        :key="item.id"
        class="cursor-pointer h-34px flex-y-center justify-between gap-12px px-16px transition-colors hover:bg-#f5f5f5 dark:hover:bg-#2a2a2a"
        :title="item.title ?? undefined"
        @click="openNotice(item)"
      >
        <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
        <span class="shrink-0 text-#999 text-13px">{{ item.onTime }}</span>
      </div>
    </template>
  </NCard>

  <NoticeDetailModal v-model:visible="detailVisible" :notice="detailNotice" />
</template>

<style scoped></style>
