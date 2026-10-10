<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules } from 'naive-ui';
import { fetchCreateDictEntry, fetchUpdateDictEntry } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'DictEntryOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.DictEntryForm | null;
  /**
   * Dictionary selected in the left list
   *
   * When adding an entry it is passed silently as the owning dictionary (`pid`), so the new entry
   * always belongs to the dictionary currently being browsed.
   */
  activeDictId?: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const model = reactive<Api.SystemManage.DictEntryForm>({
  id: undefined,
  code: '',
  pid: '',
  val: '',
  val2: '',
  val3: '',
  val4: '',
  // not editable in this form: it is only carried here so an update keeps the current backend value,
  // the state is changed from the dedicated enable / disable action instead
  state: 'ON',
  remark: '',
  sn: 1
});

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

/** show the skeleton until the edit detail is loaded into `row` */
const loading = computed(() => props.operateType === 'edit' && !props.row);

const rules: FormRules = {
  code: defaultRequiredRule,
  pid: defaultRequiredRule
};

watch([visible, () => props.row], ([val]) => {
  if (!val) return;

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    code: props.row?.code ?? '',
    // the owning dictionary is never edited: it is passed silently, either the dictionary selected in
    // the left list (add) or the entry's own dictionary (edit, falling back to the selected one)
    pid: props.operateType === 'add' ? (props.activeDictId ?? '') : props.row?.pid || props.activeDictId || '',
    val: props.row?.val ?? '',
    val2: props.row?.val2 ?? '',
    val3: props.row?.val3 ?? '',
    val4: props.row?.val4 ?? '',
    state: props.row?.state ?? 'ON',
    remark: props.row?.remark ?? '',
    sn: props.row?.sn ?? 1
  });
});

async function handleSubmit() {
  const { error } = props.operateType === 'add' ? await fetchCreateDictEntry(model) : await fetchUpdateDictEntry(model);

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
    <NFormItem path="code">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.code')" />
      </template>
      <NInput v-model:value="model.code" :placeholder="$t('page.manage.dict.entry.code')" />
    </NFormItem>
    <NFormItem path="sn">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.sn')" />
      </template>
      <NInputNumber v-model:value="model.sn" :min="0" class="w-full" />
    </NFormItem>
    <NFormItem path="val">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.val')" />
      </template>
      <NInput v-model:value="model.val" :placeholder="$t('page.manage.dict.entry.val')" />
    </NFormItem>
    <NFormItem path="val2">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.val2')" />
      </template>
      <NInput v-model:value="model.val2" :placeholder="$t('page.manage.dict.entry.val2')" />
    </NFormItem>
    <NFormItem path="val3">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.val3')" />
      </template>
      <NInput v-model:value="model.val3" :placeholder="$t('page.manage.dict.entry.val3')" />
    </NFormItem>
    <NFormItem path="val4">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.val4')" />
      </template>
      <NInput v-model:value="model.val4" :placeholder="$t('page.manage.dict.entry.val4')" />
    </NFormItem>
    <NFormItem class="col-span-2" path="remark">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.entry.remark')" />
      </template>
      <NInput
        v-model:value="model.remark"
        type="textarea"
        :rows="2"
        :placeholder="$t('page.manage.dict.entry.remark')"
      />
    </NFormItem>
  </FormDialog>
</template>

<style scoped></style>
