<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({
  name: 'MsgTemplatePreview'
});

interface Props {
  /** current form values, reactive so the preview updates while typing */
  model: {
    title: string;
    titleDesc: string;
    subTitle: string;
    subTitleDesc: string;
    remark: string;
    remarkDesc: string;
    whetherConfirm: boolean;
    hidden: boolean;
  };
  /** template entries, including the empty row being edited */
  entries: Api.SystemManage.MsgTemplateEntry[];
  /** hide the built-in card header, e.g. when the modal already has a title */
  showHeader?: boolean;
}

const props = defineProps<Props>();

/** entries that already have something worth previewing */
const visibleEntries = computed(() =>
  props.entries.filter(entry => (entry.label ?? '').trim() || (entry.prop ?? '').trim() || (entry.val ?? '').trim())
);

/** whether the form is empty, so an empty state can be shown instead of a blank card */
const hasContent = computed(
  () =>
    Boolean(props.model.title.trim()) ||
    Boolean(props.model.titleDesc.trim()) ||
    Boolean(props.model.subTitle.trim()) ||
    Boolean(props.model.subTitleDesc.trim()) ||
    Boolean(props.model.remark.trim()) ||
    Boolean(props.model.remarkDesc.trim()) ||
    visibleEntries.value.length > 0
);

/** label of an entry, falling back to its field name while the label is being typed */
function entryLabel(entry: Api.SystemManage.MsgTemplateEntry) {
  return entry.label || entry.prop || '';
}

/** value of an entry, showing its field name as `{prop}` when no default value is filled yet */
function entryValue(entry: Api.SystemManage.MsgTemplateEntry) {
  if (entry.val) return entry.val;

  return entry.prop ? `{${entry.prop}}` : '';
}
</script>

<template>
  <div class="msg-preview">
    <div v-if="showHeader !== false" class="msg-preview__header">
      <icon-mdi-message-text-outline class="text-16px" />
      <span>{{ $t('page.manage.msgTemplate.preview') }}</span>
    </div>

    <div class="msg-preview__body">
      <template v-if="hasContent">
        <div class="msg-preview__title">
          {{ model.title || $t('page.manage.msgTemplate.previewTitlePlaceholder') }}
        </div>
        <div v-if="model.titleDesc" class="msg-preview__note">{{ model.titleDesc }}</div>

        <div v-if="model.subTitle" class="msg-preview__subtitle">{{ model.subTitle }}</div>
        <div v-if="model.subTitleDesc" class="msg-preview__note">{{ model.subTitleDesc }}</div>

        <div v-if="visibleEntries.length" class="msg-preview__entries">
          <div v-for="(entry, index) in visibleEntries" :key="index" class="msg-preview__entry">
            <span class="msg-preview__label">{{ entryLabel(entry) }}</span>
            <span
              class="msg-preview__value"
              :class="{ 'msg-preview__value--placeholder': !entry.val }"
              :style="entry.val && entry.color ? { color: entry.color } : undefined"
            >
              {{ entryValue(entry) }}
            </span>
          </div>
        </div>

        <div v-if="model.remark" class="msg-preview__remark">{{ model.remark }}</div>
        <div v-if="model.remarkDesc" class="msg-preview__note">{{ model.remarkDesc }}</div>

        <div v-if="model.whetherConfirm || model.hidden" class="msg-preview__tags">
          <NTag v-if="model.whetherConfirm" size="small" type="warning" :bordered="false">
            {{ $t('page.manage.msgTemplate.previewConfirm') }}
          </NTag>
          <NTag v-if="model.hidden" size="small" :bordered="false">
            {{ $t('page.manage.msgTemplate.previewHidden') }}
          </NTag>
        </div>
      </template>

      <div v-else class="msg-preview__empty">
        <icon-mdi-message-text-outline class="text-28px" />
        <span>{{ $t('page.manage.msgTemplate.previewEmpty') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-preview {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #fff;
}

.msg-preview__header {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 14px;
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.msg-preview__body {
  padding: 14px;
}

.msg-preview__title {
  color: #1f1f1f;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  word-break: break-word;
}

.msg-preview__subtitle {
  margin-top: 10px;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
}

.msg-preview__note {
  margin-top: 2px;
  color: #999;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.msg-preview__entries {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  border-radius: 6px;
  padding: 10px 12px;
  background-color: #f7f8fa;
}

.msg-preview__entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.msg-preview__label {
  flex-shrink: 0;
  min-width: 56px;
  color: #999;
}

.msg-preview__value {
  flex: 1;
  min-width: 0;
  color: #333;
  word-break: break-word;
}

.msg-preview__value--placeholder {
  color: #bbb;
  font-style: italic;
}

.msg-preview__remark {
  margin-top: 12px;
  border-top: 1px dashed #eee;
  padding-top: 10px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.msg-preview__tags {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.msg-preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 12px;
  color: #bbb;
  font-size: 12px;
  text-align: center;
}

.dark .msg-preview {
  border-color: #33343a;
  background-color: #18181c;
}

.dark .msg-preview__header {
  border-color: #2a2a2e;
  color: #aaa;
}

.dark .msg-preview__title {
  color: #e5e5e5;
}

.dark .msg-preview__subtitle {
  color: #ddd;
}

.dark .msg-preview__entries {
  background-color: #232326;
}

.dark .msg-preview__value {
  color: #ddd;
}

.dark .msg-preview__value--placeholder {
  color: #666;
}

.dark .msg-preview__remark {
  border-color: #33343a;
  color: #bbb;
}

.dark .msg-preview__empty {
  color: #666;
}
</style>
