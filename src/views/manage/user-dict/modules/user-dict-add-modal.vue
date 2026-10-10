<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormRules, SelectOption } from 'naive-ui';
import { fetchAddUserDict, fetchDictSearch } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'UserDictAddModal'
});

interface Props {
  /** the user the dictionaries are added to */
  userId: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const rules: FormRules = {
  // the multi-select edits an array, so the required rule needs the array type
  dictIds: { ...defaultRequiredRule, type: 'array' }
};

/** the dictionaries picked for the user */
const model = reactive<{ dictIds: string[] }>({ dictIds: [] });

/** how many dictionaries one search returns */
const SEARCH_SIZE = 50;

/** candidates of the current search; the list is never loaded as a whole */
const options = ref<SelectOption[]>([]);
const searching = ref(false);

/**
 * Search the dictionaries by code / name
 *
 * Both rows carry `fast: true`, which makes the backend OR them (`code like ? or name like ?`)
 * instead of AND-ing them like ordinary conditions.
 */
async function searchDicts(keyword: string) {
  const value = keyword.trim();

  // nothing is searched until the operator types, so the whole dictionary list is never requested
  if (!value) {
    options.value = [];

    return;
  }

  searching.value = true;

  const { data, error } = await fetchDictSearch({
    page: 1,
    size: SEARCH_SIZE,
    items: [
      { prop: 'code', values: [value], fast: true },
      { prop: 'name', values: [value], fast: true }
    ],
    orders: []
  });

  if (!error) {
    options.value = (data?.rows ?? []).map(dict => ({
      label: `${dict.code} - ${dict.name}`,
      value: String(dict.id)
    }));
  }

  searching.value = false;
}

async function handleSubmit() {
  const { error } = await fetchAddUserDict({ userId: props.userId, dictIds: model.dictIds });

  if (!error) {
    window.$message?.success($t('common.addSuccess'));
    emit('submitted');
  }
}

/** start over every time the dialog opens */
watch(visible, val => {
  if (!val) return;

  restoreValidation();
  model.dictIds = [];
  options.value = [];
});
</script>

<template>
  <FormDialog
    ref="formRef"
    v-model:visible="visible"
    :title="$t('system.dict.addUserDict')"
    :model="model"
    :rules="rules"
    :submit="handleSubmit"
  >
    <NFormItem class="col-span-2" path="dictIds">
      <template #label>
        <FormLabel :label="$t('page.manage.dict.ownedDict')" />
      </template>
      <NSelect
        v-model:value="model.dictIds"
        multiple
        filterable
        remote
        clearable
        :options="options"
        :loading="searching"
        :placeholder="$t('page.manage.dict.searchDict')"
        @search="searchDicts"
      />
    </NFormItem>
  </FormDialog>
</template>
