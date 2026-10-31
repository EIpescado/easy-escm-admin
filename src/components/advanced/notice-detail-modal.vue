<script setup lang="ts">
import { ref, watch } from 'vue';
import { fetchNoticeDetail } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'NoticeDetailModal'
});

interface Props {
  /**
   * Notice that was clicked
   *
   * Its title / time are shown right away, the body comes from the detail endpoint.
   */
  notice: Api.SystemManage.Notice | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const detail = ref<Api.SystemManage.Notice | null>(null);

/** increments on every open, drops a detail response of a superseded one */
let detailToken = 0;

watch(visible, async val => {
  if (!val) return;

  detail.value = props.notice;
  loading.value = true;

  const token = ++detailToken;
  const id = props.notice?.id;

  if (!id) {
    loading.value = false;

    return;
  }

  const { data, error } = await fetchNoticeDetail(id);

  // ignore the response when another notice was opened meanwhile
  if (token !== detailToken) return;

  if (!error && data) {
    // the detail Vo carries the body / targets but not the translated type, keep it from the row
    detail.value = { ...props.notice, ...data };
  }

  loading.value = false;
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    class="notice-detail-modal"
    :title="detail?.title ?? ''"
    :mask-closable="false"
    :style="{ width: '560px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <div class="notice-meta">
      <NTag v-if="detail?.typeVal" size="small" :bordered="false" type="info">{{ detail.typeVal }}</NTag>
      <span v-if="detail?.onTime">{{ $t('page.manage.notice.publishTime') }}：{{ detail.onTime }}</span>
    </div>
    <!-- the body scrolls inside the dialog, so a long notice never pushes the card off screen -->
    <div class="notice-scroll">
      <NSpin :show="loading">
        <!-- eslint-disable-next-line vue/no-v-html -- the body is html written by the admin rich text editor -->
        <div class="notice-content" v-html="detail?.content ?? ''"></div>
      </NSpin>
    </div>
  </NModal>
</template>

<style scoped>
.notice-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #999;
  font-size: 13px;
}

/* the body scrolls inside the dialog, so a long notice never pushes the card off screen */
.notice-scroll {
  max-height: 60vh;
  padding-right: 6px;
  overflow-y: auto;
}

/* render the html written by the rich text editor, centered like a notice board */
.notice-content {
  color: var(--n-text-color);
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
  word-break: break-word;
}

.notice-content :deep(p) {
  margin: 0 0 8px;
}

.notice-content :deep(ul),
.notice-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 0;
  list-style: revert;
  list-style-position: inside;
}

.notice-content :deep(h1),
.notice-content :deep(h2),
.notice-content :deep(h3),
.notice-content :deep(h4),
.notice-content :deep(h5) {
  margin: 8px 0;
  font-weight: 600;
}

.notice-content :deep(img) {
  max-width: 100%;
  /* the global preflight makes images block, so text-align alone does not center them */
  margin-right: auto;
  margin-left: auto;
}

.notice-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.notice-content :deep(th),
.notice-content :deep(td) {
  padding: 4px 8px;
  border: 1px solid var(--n-border-color);
}
</style>

<style>
/*
 * the card header is rendered by naive-ui (outside this component's scope), so the title is
 * centered from a global rule
 */
.notice-detail-modal .n-card-header__main {
  flex: 1;
  text-align: center;
}
</style>
