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
  /** selectable dictionaries, used by the owning-dictionary field */
  dictOptions: { label: string; value: string }[];
  /**
   * Dictionary selected in the left list
   *
   * When adding an entry the owning-dictionary field is fixed to it, so the new entry always belongs
   * to the dictionary currently being browsed.
   */
  activeDictId?: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
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

/** the owning dictionary cannot be changed when adding, it follows the selected dictionary */
const isDictLocked = computed(() => props.operateType === 'add');

const rules: FormRules = {
  code: defaultRequiredRule,
  pid: defaultRequiredRule
};

watch(visible, val => {
  if (!val) return;

  restoreValidation();

  Object.assign(model, {
    id: props.row?.id,
    code: props.row?.code ?? '',
    pid: isDictLocked.value ? (props.activeDictId ?? '') : (props.row?.pid ?? ''),
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
  await validate();

  const { error } = props.operateType === 'add' ? await fetchCreateDictEntry(model) : await fetchUpdateDictEntry(model);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-640px">
    <NForm
      ref="formRef"
      :model="model"
      :rules="rules"
      label-placement="left"
      require-mark-placement="left"
      :label-width="110"
    >
      <div class="grid grid-cols-2 gap-x-16px gap-y-4px">
        <NFormItem path="pid">
          <template #label>
            <FormLabel :label="$t('page.manage.dict.name')" />
          </template>
          <NSelect
            v-model:value="model.pid"
            filterable
            :disabled="isDictLocked"
            :options="dictOptions"
            :placeholder="$t('page.manage.dict.name')"
          />
        </NFormItem>
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
      </div>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
