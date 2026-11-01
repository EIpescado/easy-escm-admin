<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchMsgTemplateDetail } from '@/service/api';
import { $t } from '@/locales';
import MsgTemplatePreview from './msg-template-preview.vue';

defineOptions({
  name: 'MsgTemplatePreviewModal'
});

interface Props {
  /**
   * Template that was clicked
   *
   * The row already carries the title / descriptions, the sub title and entries come from the
   * detail endpoint.
   */
  template: Api.SystemManage.MsgTemplate | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

const loading = ref(false);
const detail = ref<Api.SystemManage.MsgTemplate | null>(null);

/** increments on every open, drops a detail response of a superseded one */
let detailToken = 0;

const previewModel = computed(() => ({
  title: detail.value?.title ?? '',
  titleDesc: detail.value?.titleDesc ?? '',
  subTitle: detail.value?.subTitle ?? '',
  subTitleDesc: detail.value?.subTitleDesc ?? '',
  remark: detail.value?.remark ?? '',
  remarkDesc: detail.value?.remarkDesc ?? '',
  whetherConfirm: Boolean(detail.value?.whetherConfirm),
  hidden: Boolean(detail.value?.hidden)
}));

const previewEntries = computed(() => detail.value?.entryList ?? []);

watch(visible, async val => {
  if (!val) return;

  detail.value = props.template;
  loading.value = true;

  const token = ++detailToken;
  const id = props.template?.id;

  if (!id) {
    loading.value = false;

    return;
  }

  const { data, error } = await fetchMsgTemplateDetail(id);

  // ignore the response when another template was opened meanwhile
  if (token !== detailToken) return;

  if (!error && data) {
    // the detail carries subTitle / entryList, keep the translated type from the row
    detail.value = { ...props.template, ...data };
  }

  loading.value = false;
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.manage.msgTemplate.previewDetail')"
    :mask-closable="false"
    :style="{ width: '420px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <NSpin :show="loading">
      <MsgTemplatePreview :model="previewModel" :entries="previewEntries" :show-header="false" />
    </NSpin>
  </NModal>
</template>
