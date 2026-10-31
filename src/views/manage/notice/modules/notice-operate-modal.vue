<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormItemInst, FormRules } from 'naive-ui';
import dayjs from 'dayjs';
import { fetchCreateNotice, fetchNoticeDetail, fetchUpdateNotice } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import { isBlankHtml } from '@/utils/common';
import RemoteSelect from '@/components/advanced/remote-select.vue';
import RichTextEditor from '@/components/advanced/rich-text-editor.vue';

defineOptions({
  name: 'NoticeOperateModal'
});

/** dictionaries used by the notice type and its visibility targets */
const DICT_NOTICE_TYPE = 'system_notice_type';
const DICT_TARGET_TYPE = 'system_notice_target_type';

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.Notice | null;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

/** label of the selected type, so an edit shows it before the remote page arrives */
const typeFallback = computed(() =>
  props.row?.type ? { label: props.row.typeVal || props.row.type, value: props.row.type } : null
);

/** datetime pattern of the backend, `FastJsonConfig#setDateFormat` */
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

interface NoticeModel {
  id?: string;
  type: string | null;
  title: string;
  content: string;
  onTime: string | null;
  offTime: string | null;
}

function createEmptyModel(): NoticeModel {
  return {
    id: undefined,
    type: null,
    title: '',
    content: '',
    onTime: dayjs().format(DATETIME_FORMAT),
    offTime: dayjs().add(7, 'day').format(DATETIME_FORMAT)
  };
}

const model = reactive<NoticeModel>(createEmptyModel());

/** visibility targets, edited with the built-in dynamic input */
const targets = ref<Api.SystemManage.NoticeTarget[]>([]);

/** the content form item, re-validated while the rich text editor changes */
const contentItemRef = ref<FormItemInst | null>(null);

/**
 * Keep the editor content in the model and clear the required error while the user types
 *
 * The editor is not a naive-ui control, so it cannot trigger the form item validation itself. It
 * also emits a change with the empty `<p><br></p>` as soon as it mounts, so an empty value is left
 * to the submit validation instead of flagging the field right away.
 */
function handleContentChange(value: string) {
  model.content = value;

  if (!isBlankHtml(value)) {
    contentItemRef.value?.validate({ trigger: 'change' }).catch(() => {});
  }
}

/** the edit detail (with the content and targets) is being loaded */
const loading = ref(false);

/** increments on every open, drops a detail response of a superseded open */
let detailToken = 0;

const title = computed(() =>
  $t(props.operateType === 'add' ? 'page.manage.notice.createTitle' : 'page.manage.notice.editTitle')
);

const rules: FormRules = {
  type: defaultRequiredRule,
  title: defaultRequiredRule,
  // the editor emits markup even when nothing was typed, so check the visible text instead
  content: {
    required: true,
    trigger: ['blur', 'change'],
    validator: (_rule, value) => (isBlankHtml(String(value ?? '')) ? new Error($t('form.required')) : true)
  },
  onTime: defaultRequiredRule,
  offTime: defaultRequiredRule
};

function createTarget(): Api.SystemManage.NoticeTarget {
  return { targetType: null, targetCode: '' };
}

function fillFrom(detail: Api.SystemManage.Notice) {
  Object.assign(model, {
    id: detail.id,
    type: detail.type ?? null,
    title: detail.title ?? '',
    content: detail.content ?? '',
    onTime: detail.onTime ?? null,
    offTime: detail.offTime ?? null
  });

  targets.value = (detail.targets ?? []).map(item => ({
    targetType: item.targetType ?? null,
    targetCode: item.targetCode ?? ''
  }));
}

watch(visible, async val => {
  if (!val) return;

  restoreValidation();
  Object.assign(model, createEmptyModel());
  targets.value = [];

  const token = ++detailToken;

  if (props.operateType === 'edit' && props.row) {
    loading.value = true;

    // the list To has neither `content` nor `targets`, so take the whole notice from the detail endpoint
    const { data, error } = await fetchNoticeDetail(props.row.id);

    // ignore the response when the dialog was closed or reopened meanwhile
    if (token !== detailToken || !visible.value) return;

    if (!error && data) {
      fillFrom(data);
    }

    loading.value = false;
  } else {
    loading.value = false;
  }
});

async function handleSubmit() {
  const payload: Api.SystemManage.NoticeForm = {
    id: model.id,
    type: model.type ?? '',
    title: model.title.trim(),
    content: model.content,
    onTime: model.onTime ?? '',
    offTime: model.offTime ?? '',
    targets: targets.value
      .filter(item => (item.targetCode ?? '').trim())
      .map(item => ({ targetType: item.targetType, targetCode: item.targetCode?.trim() }))
  };

  const { error } = props.operateType === 'add' ? await fetchCreateNotice(payload) : await fetchUpdateNotice(payload);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="title"
    :loading="loading"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NFormItem path="type">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.type')" />
      </template>
      <RemoteSelect
        v-model:value="model.type"
        source="dict"
        :dict-code="DICT_NOTICE_TYPE"
        :fallback-option="typeFallback"
        :placeholder="$t('page.manage.notice.typePlaceholder')"
      />
    </NFormItem>
    <NFormItem path="title">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.title')" />
      </template>
      <NInput v-model:value="model.title" :placeholder="$t('page.manage.notice.title')" />
    </NFormItem>
    <NFormItem path="onTime">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.onTime')" />
      </template>
      <NDatePicker
        v-model:formatted-value="model.onTime"
        type="datetime"
        value-format="yyyy-MM-dd HH:mm:ss"
        class="w-full"
        clearable
      />
    </NFormItem>
    <NFormItem path="offTime">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.offTime')" />
      </template>
      <NDatePicker
        v-model:formatted-value="model.offTime"
        type="datetime"
        value-format="yyyy-MM-dd HH:mm:ss"
        class="w-full"
        clearable
      />
    </NFormItem>
    <NFormItem class="col-span-2">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.targets')" :tip="$t('page.manage.notice.targetsTip')" />
      </template>
      <NDynamicInput v-model:value="targets" :on-create="createTarget">
        <template #default="{ value }">
          <div class="w-full flex items-center gap-8px">
            <RemoteSelect
              v-model:value="value.targetType"
              source="dict"
              :dict-code="DICT_TARGET_TYPE"
              :placeholder="$t('page.manage.notice.targetType')"
              class="w-150px shrink-0"
            />
            <NInput
              v-model:value="value.targetCode"
              :placeholder="$t('page.manage.notice.targetCode')"
              class="min-w-0 flex-1"
            />
          </div>
        </template>
      </NDynamicInput>
    </NFormItem>
    <NFormItem ref="contentItemRef" class="col-span-2" path="content">
      <template #label>
        <FormLabel :label="$t('page.manage.notice.content')" />
      </template>
      <RichTextEditor
        :model-value="model.content"
        :placeholder="$t('page.manage.notice.content')"
        :height="300"
        @update:model-value="handleContentChange"
      />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
