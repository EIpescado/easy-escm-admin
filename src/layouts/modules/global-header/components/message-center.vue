<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPageSearch } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { parseMsgContent } from '@/utils/msg';
import { $t } from '@/locales';

defineOptions({
  name: 'MessageCenter'
});

/** route of the full message center page; it only exists when the backend menu provides it */
const MESSAGE_CENTER_ROUTE = 'msg-center';

/** messages fetched per page */
const PAGE_SIZE = 10;

/** how close to the bottom (in px) the next page starts loading */
const LOAD_DISTANCE = 24;

/** the message Qo takes `haveRead` as a top-level flag instead of a condition */
type MsgQo = Api.SystemManage.PageQo & { haveRead: boolean };

const router = useRouter();
const appStore = useAppStore();

const visible = ref(false);

/** unread messages of the current user, newest first (the backend orders by `create_time desc`) */
const messages = ref<Api.SystemManage.SystemMsg[]>([]);
const loading = ref(false);
const page = ref(0);
const total = ref(0);

const hasMore = computed(() => messages.value.length < total.value);

/** the messages with their JSON content parsed, the title doubles as the heading of an item */
const viewMessages = computed(() =>
  messages.value.map(message => {
    const { title, subTitle, lines } = parseMsgContent(message.content);

    return { ...message, heading: title || subTitle, subTitle: title ? subTitle : '', lines };
  })
);

/** the page is hidden while no menu grants it, then the footer link is disabled */
const canOpenCenter = computed(() => router.hasRoute(MESSAGE_CENTER_ROUTE));

const drawerWidth = computed(() => (appStore.isMobile ? 'min(90vw, 420px)' : 420));

/** load a page, appending it unless `reset`; a second request is dropped while one is in flight */
async function load(reset: boolean) {
  if (loading.value) return;

  const next = reset ? 1 : page.value + 1;

  loading.value = true;

  try {
    // only unread messages: the drawer is the "what is new" corner, the page shows the history
    const params: MsgQo = { page: next, size: PAGE_SIZE, items: [], orders: [], haveRead: false };

    const { data, error } = await fetchPageSearch<Api.SystemManage.SystemMsg>('/system/msg/search', params);

    if (error || !data) return;

    messages.value = reset ? data.rows : [...messages.value, ...data.rows];
    page.value = next;
    total.value = Number(data.total);
  } finally {
    loading.value = false;
  }
}

function handleOpen() {
  visible.value = true;
}

// the list is refreshed every time the drawer opens, so new messages show up without a reload
watch(visible, val => {
  if (!val) return;

  messages.value = [];
  page.value = 0;
  total.value = 0;
  load(true);
});

/** `NInfiniteScroll` asks for the next page whenever the list is scrolled to the bottom */
async function handleLoadMore() {
  if (!hasMore.value) return;

  await load(false);
}

function goToMessageCenter() {
  visible.value = false;

  if (canOpenCenter.value) {
    router.push({ name: MESSAGE_CENTER_ROUTE });
  }
}
</script>

<template>
  <ButtonIcon
    class="message-center-button"
    :tooltip-content="$t('messageCenter.title')"
    icon="mdi:bell-outline"
    @click="handleOpen"
  />
  <NDrawer v-model:show="visible" display-directive="show" placement="right" :width="drawerWidth">
    <NDrawerContent :title="$t('messageCenter.title')" native-scrollbar closable>
      <NInfiniteScroll class="h-full" :distance="LOAD_DISTANCE" :on-load="handleLoadMore">
        <div
          v-if="!messages.length && !loading"
          class="h-full flex flex-col items-center justify-center gap-8px py-48px text-13px text-gray-400 dark:text-gray-500"
        >
          <icon-mdi-bell-off-outline class="text-32px" />
          <span>{{ $t('messageCenter.emptyUnread') }}</span>
        </div>
        <ul v-else class="flex flex-col">
          <li
            v-for="item in viewMessages"
            :key="item.id"
            class="rounded-6px px-8px py-10px transition-colors hover:bg-#f7f8fa dark:hover:bg-#2a2a2e"
          >
            <div class="flex items-baseline gap-8px">
              <span class="min-w-0 flex-1 truncate text-13px font-600" :title="item.heading">{{ item.heading }}</span>
              <span class="shrink-0 text-12px text-gray-400 dark:text-gray-500">{{ item.createTime }}</span>
            </div>
            <div v-if="item.subTitle" class="mt-2px text-12px text-gray-500 dark:text-gray-400">
              {{ item.subTitle }}
            </div>
            <div
              v-for="(line, index) in item.lines"
              :key="index"
              class="mt-2px break-words text-12px leading-relaxed text-gray-600 dark:text-gray-300"
            >
              {{ line }}
            </div>
            <NDivider :style="{ margin: '8px 0 0' }" />
          </li>
        </ul>

        <div v-if="loading" class="flex-center gap-6px py-12px text-12px text-gray-400 dark:text-gray-500">
          <NSpin :size="14" />
          <span>{{ $t('common.loading') }}</span>
        </div>
        <div
          v-else-if="messages.length && !hasMore"
          class="py-12px text-center text-12px text-gray-400 dark:text-gray-500"
        >
          {{ $t('messageCenter.noMore') }}
        </div>
      </NInfiniteScroll>

      <template #footer>
        <NButton block secondary :disabled="!canOpenCenter" @click="goToMessageCenter">
          {{ $t('messageCenter.viewAll') }}
        </NButton>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
