<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { FormRules, TreeSelectOption } from 'naive-ui';
import { fetchCreateMenu, fetchUpdateMenu } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'MenuOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.MenuForm | null;
  parentId: string;
  rootPid: string;
  tree: Api.SystemManage.MenuNode[];
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const model = reactive<Api.SystemManage.MenuForm>({
  id: undefined,
  pid: props.rootPid,
  title: '',
  routerName: '',
  component: '',
  path: '',
  icon: '',
  cached: true,
  hidden: false,
  iFrame: false,
  sortNo: 1
});

const title = computed(() => (props.operateType === 'add' ? $t('common.add') : $t('common.edit')));

const rules: FormRules = {
  title: defaultRequiredRule,
  routerName: defaultRequiredRule,
  path: defaultRequiredRule,
  component: defaultRequiredRule,
  sortNo: defaultRequiredRule
};

function transformOptions(nodes: Api.SystemManage.MenuNode[]): TreeSelectOption[] {
  return nodes.map(node => ({
    key: node.id,
    label: node.meta?.title || node.name,
    children: node.children?.length ? transformOptions(node.children) : undefined
  }));
}

const parentOptions = computed<TreeSelectOption[]>(() => [
  {
    key: props.rootPid,
    label: $t('page.manage.menu.root'),
    children: transformOptions(props.tree)
  }
]);

watch(visible, val => {
  if (!val) return;

  restoreValidation();

  if (props.row) {
    Object.assign(model, { ...props.row });
  } else {
    Object.assign(model, {
      id: undefined,
      pid: props.parentId,
      title: '',
      routerName: '',
      component: '',
      path: '',
      icon: '',
      cached: true,
      hidden: false,
      iFrame: false,
      sortNo: 1
    });
  }
});

async function handleSubmit() {
  await validate();

  const payload: Api.SystemManage.MenuForm = { ...model, pid: model.pid || props.rootPid };

  const { error } = props.operateType === 'add' ? await fetchCreateMenu(payload) : await fetchUpdateMenu(payload);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    emit('submitted');
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="title" class="w-560px">
    <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="90">
      <NFormItem :label="$t('page.manage.menu.parent')" path="pid">
        <NTreeSelect v-model:value="model.pid" :options="parentOptions" :placeholder="$t('page.manage.menu.parent')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.title')" path="title">
        <NInput v-model:value="model.title" :placeholder="$t('page.manage.menu.title')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.name')" path="routerName">
        <NInput
          v-model:value="model.routerName"
          :placeholder="$t('page.manage.menu.name')"
          :disabled="operateType === 'edit'"
        />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.path')" path="path">
        <NInput v-model:value="model.path" :placeholder="$t('page.manage.menu.path')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.component')" path="component">
        <NInput v-model:value="model.component" :placeholder="$t('page.manage.menu.componentPlaceholder')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.icon')" path="icon">
        <NInput v-model:value="model.icon" :placeholder="$t('page.manage.menu.iconPlaceholder')" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.order')" path="sortNo">
        <NInputNumber v-model:value="model.sortNo" :min="0" class="w-full" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.cached')" path="cached">
        <NSwitch v-model:value="model.cached" />
      </NFormItem>
      <NFormItem :label="$t('page.manage.menu.hidden')" path="hidden">
        <NSwitch v-model:value="model.hidden" />
      </NFormItem>
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
