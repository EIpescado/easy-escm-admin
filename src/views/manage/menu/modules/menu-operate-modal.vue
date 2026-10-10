<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormRules, TreeSelectOption } from 'naive-ui';
import { fetchCreateButton, fetchCreateMenu, fetchRoleSelect, fetchUpdateButton, fetchUpdateMenu } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'MenuOperateModal'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  row: Api.SystemManage.MenuNode | null;
  /** force button mode when adding */
  addButton?: boolean;
  /** add a top-level menu: `pid` empty and component fixed to `root` */
  addTopMenu?: boolean;
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

const { formRef, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

type MenuMeta = Api.SystemManage.MenuMeta;

/** editable model covering both a menu (SystemMenuFo) and a button (SystemButtonFo) */
interface EditModel {
  id?: string;
  beButton: boolean;
  /** menu pid / button menuId */
  pid: string;
  name: string;
  sn: number;
  permission: string;
  permissions: string[];
  // menu
  path: string;
  component: string;
  meta: MenuMeta;
  /** props as key-value pairs */
  props: { key: string; value: string }[];
  // button
  icon: string;
  position: string;
  click: string;
  i18nKey: string;
}

function createMenuMeta(): MenuMeta {
  return {
    title: '',
    i18nKey: '',
    roles: [],
    keepAlive: true,
    constant: false,
    icon: '',
    localIcon: '',
    href: '',
    hideInMenu: false,
    activeMenu: '',
    multiTab: false,
    query: []
  };
}

function createEmptyModel(): EditModel {
  return {
    id: undefined,
    beButton: false,
    pid: props.rootPid,
    name: '',
    sn: 1,
    permission: '',
    permissions: [],
    path: '',
    component: '',
    meta: createMenuMeta(),
    props: [],
    icon: '',
    position: '',
    click: '',
    i18nKey: ''
  };
}

function fromNode(node: Api.SystemManage.MenuNode): EditModel {
  return {
    id: node.id,
    beButton: Boolean(node.beButton),
    pid: node.pid,
    name: node.name,
    sn: node.sn ?? 1,
    permission: node.permission ?? '',
    permissions: node.permissions ?? [],
    path: node.path ?? '',
    component: node.component ?? '',
    meta: {
      ...createMenuMeta(),
      ...node.meta,
      roles: node.meta?.roles ?? [],
      query: node.meta?.query ?? []
    },
    props: node.props
      ? Object.entries(node.props).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        }))
      : [],
    icon: node.meta?.icon ?? '',
    position: node.position ?? '',
    click: node.click ?? '',
    i18nKey: node.i18nKey ?? ''
  };
}

const model = reactive<EditModel>(createEmptyModel());

/** route roles options */
const roleOptions = ref<Api.SystemManage.Selector<string>[]>([]);

const title = computed(() => {
  if (props.operateType === 'edit') return $t('common.edit');
  if (props.addButton) return $t('system.button.create');
  if (props.addTopMenu) return $t('system.menu.createTopMenu');

  return $t('common.add');
});

/** show the skeleton until the edit detail is loaded into `row` */
const loading = computed(() => props.operateType === 'edit' && !props.row);

/** parse the props key-value pairs into an object for the request */
function parseMenuProps(): Record<string, unknown> | null {
  const entries = model.props.filter(item => item.key);

  if (!entries.length) return null;

  return Object.fromEntries(entries.map(item => [item.key, item.value]));
}

const rules: FormRules = {
  name: defaultRequiredRule,
  'meta.icon': defaultRequiredRule,
  'meta.i18nKey': defaultRequiredRule,
  sn: defaultRequiredRule,
  path: defaultRequiredRule,
  component: defaultRequiredRule
};

/** Iconify icon lives in `meta.icon` for menus and at the top level for buttons */
const iconValue = computed({
  get: () => (model.beButton ? model.icon : (model.meta.icon ?? '')),
  set: (value: string) => {
    if (model.beButton) {
      model.icon = value;
    } else {
      model.meta.icon = value;
    }
  }
});

/** i18n key lives in `meta.i18nKey` for menus and at the top level for buttons */
const i18nKeyValue = computed({
  get: () => (model.beButton ? model.i18nKey : (model.meta.i18nKey ?? '')),
  set: (value: string) => {
    if (model.beButton) {
      model.i18nKey = value;
    } else {
      model.meta.i18nKey = value;
    }
  }
});

/** name label: button name for buttons, route name for menus */
const nameLabel = computed(() => (model.beButton ? $t('page.manage.menu.buttonName') : $t('page.manage.menu.name')));

/** name tip: differs between buttons and menus */
const nameTip = computed(() =>
  model.beButton ? $t('page.manage.menu.tips.buttonName') : $t('page.manage.menu.tips.name')
);

/** create an empty key-value pair (used by route params and props) */
function createKeyValueItem() {
  return { key: '', value: '' };
}

/** button position options; `tag` below also allows custom values */
const positionOptions = [
  { label: 'top', value: 'top' },
  { label: 'row', value: 'row' }
];

/** common layout component presets; `tag` below also allows custom values */
const componentOptions = [
  { label: 'root', value: 'root' },
  { label: 'layout.base', value: 'layout.base' },
  { label: 'layout.blank', value: 'layout.blank' },
  { label: 'layout.base$view.iframe-page', value: 'layout.base$view.iframe-page' },
  { label: 'layout.blank$view.iframe-page', value: 'layout.blank$view.iframe-page' }
];

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

watch([visible, () => props.row], async ([val]) => {
  if (!val) return;

  restoreValidation();

  Object.assign(
    model,
    createEmptyModel(),
    props.row ? fromNode(props.row) : { pid: props.parentId, beButton: Boolean(props.addButton) }
  );

  // a top-level menu has no parent and its component is fixed to `root`
  if (props.addTopMenu) {
    model.pid = '';
    model.component = 'root';
  }

  if (!roleOptions.value.length) {
    const { data: roles } = await fetchRoleSelect();
    // the select returns role rows; use `id` as value and `roleName` as label
    roleOptions.value = (roles ?? []).map(role => ({ label: role.roleName, value: String(role.id) }));
  }
});

/** normalize meta before submitting: fill required title, drop empty optional values */
function normalizeMenuMeta(): MenuMeta {
  const { meta } = model;

  return {
    ...meta,
    title: meta.title || model.name,
    i18nKey: meta.i18nKey || undefined,
    icon: meta.icon || undefined,
    localIcon: meta.localIcon || undefined,
    href: meta.href || undefined,
    activeMenu: meta.activeMenu || undefined,
    roles: meta.roles?.length ? meta.roles : undefined,
    query: meta.query?.length ? meta.query : undefined
  };
}

function buildMenuRequest(isAdd: boolean) {
  const payload: Api.SystemManage.MenuForm = {
    id: model.id,
    // top-level menus have an empty pid; the component path is fixed to `root`
    pid: props.addTopMenu ? '' : model.pid || props.rootPid,
    name: model.name,
    path: model.path,
    component: model.component,
    meta: normalizeMenuMeta(),
    props: parseMenuProps(),
    permission: model.permission || undefined,
    permissions: model.permissions,
    sn: model.sn
  };

  return isAdd ? fetchCreateMenu(payload) : fetchUpdateMenu(payload);
}

function buildButtonRequest(isAdd: boolean) {
  const payload: Api.SystemManage.ButtonForm = {
    id: model.id,
    name: model.name,
    menuId: model.pid,
    sn: model.sn,
    icon: model.icon || undefined,
    position: model.position || undefined,
    click: model.click || undefined,
    i18nKey: model.i18nKey || undefined,
    permission: model.permission || undefined,
    permissions: model.permissions
  };

  return isAdd ? fetchCreateButton(payload) : fetchUpdateButton(payload);
}

async function handleSubmit() {
  const isAdd = props.operateType === 'add';
  const { error } = await (model.beButton ? buildButtonRequest(isAdd) : buildMenuRequest(isAdd));

  if (!error) {
    window.$message?.success(isAdd ? $t('common.addSuccess') : $t('common.updateSuccess'));
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
    :skeleton-rows="13"
    :submit="handleSubmit"
  >
    <NFormItem v-if="!model.beButton && !addTopMenu" path="pid">
      <template #label>
        <FormLabel :label="$t('page.manage.menu.parent')" :tip="$t('page.manage.menu.tips.parent')" />
      </template>
      <NTreeSelect v-model:value="model.pid" :options="parentOptions" :placeholder="$t('page.manage.menu.parent')" />
    </NFormItem>
    <NFormItem path="name">
      <template #label>
        <FormLabel :label="nameLabel" :tip="nameTip" />
      </template>
      <NInput
        v-model:value="model.name"
        :placeholder="nameLabel"
        :disabled="!model.beButton && operateType === 'edit'"
      />
    </NFormItem>
    <NFormItem :path="model.beButton ? 'icon' : 'meta.icon'">
      <template #label>
        <FormLabel :label="$t('page.manage.menu.icon')" :tip="$t('page.manage.menu.tips.icon')" />
      </template>
      <NInput v-model:value="iconValue" :placeholder="$t('page.manage.menu.iconPlaceholder')" />
    </NFormItem>
    <NFormItem :path="model.beButton ? 'i18nKey' : 'meta.i18nKey'">
      <template #label>
        <FormLabel :label="$t('page.manage.menu.i18nKey')" :tip="$t('page.manage.menu.tips.i18nKey')" />
      </template>
      <NInput v-model:value="i18nKeyValue" :placeholder="$t('page.manage.menu.i18nKey')" />
    </NFormItem>
    <NFormItem path="sn" required>
      <template #label>
        <FormLabel :label="$t('page.manage.menu.sn')" :tip="$t('page.manage.menu.tips.sn')" />
      </template>
      <NInputNumber v-model:value="model.sn" :min="0" class="w-full" />
    </NFormItem>
    <NFormItem path="permission">
      <template #label>
        <FormLabel :label="$t('page.manage.menu.permission')" :tip="$t('page.manage.menu.tips.permission')" />
      </template>
      <NInput v-model:value="model.permission" :placeholder="$t('page.manage.menu.permission')" />
    </NFormItem>

    <template v-if="model.beButton">
      <NFormItem path="click">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.click')" :tip="$t('page.manage.menu.tips.click')" />
        </template>
        <NInput v-model:value="model.click" :placeholder="$t('page.manage.menu.click')" />
      </NFormItem>
      <NFormItem path="position">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.buttonPosition')" :tip="$t('page.manage.menu.tips.position')" />
        </template>
        <NSelect
          v-model:value="model.position"
          tag
          filterable
          :options="positionOptions"
          :placeholder="$t('page.manage.menu.buttonPosition')"
        />
      </NFormItem>
    </template>

    <template v-else>
      <NFormItem path="meta.title">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.title')" :tip="$t('page.manage.menu.tips.title')" />
        </template>
        <NInput v-model:value="model.meta.title" :placeholder="$t('page.manage.menu.title')" />
      </NFormItem>
      <NFormItem path="path">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.path')" :tip="$t('page.manage.menu.tips.path')" />
        </template>
        <NInput v-model:value="model.path" :placeholder="$t('page.manage.menu.path')" />
      </NFormItem>
      <NFormItem path="component">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.component')" :tip="$t('page.manage.menu.tips.component')" />
        </template>
        <NSelect
          v-model:value="model.component"
          tag
          filterable
          :disabled="addTopMenu"
          :options="componentOptions"
          :placeholder="$t('page.manage.menu.componentPlaceholder')"
        />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.localIcon')" :tip="$t('page.manage.menu.tips.localIcon')" />
        </template>
        <NInput v-model:value="model.meta.localIcon" :placeholder="$t('page.manage.menu.localIcon')" />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.roles')" :tip="$t('page.manage.menu.tips.roles')" />
        </template>
        <NSelect
          v-model:value="model.meta.roles"
          multiple
          :options="roleOptions"
          :placeholder="$t('page.manage.menu.roles')"
        />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.href')" :tip="$t('page.manage.menu.tips.href')" />
        </template>
        <NInput v-model:value="model.meta.href" :placeholder="$t('page.manage.menu.href')" />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.activeMenu')" :tip="$t('page.manage.menu.tips.activeMenu')" />
        </template>
        <NInput v-model:value="model.meta.activeMenu" :placeholder="$t('page.manage.menu.activeMenu')" />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel
            :label="$t('page.manage.menu.fixedIndexInTab')"
            :tip="$t('page.manage.menu.tips.fixedIndexInTab')"
          />
        </template>
        <NInputNumber v-model:value="model.meta.fixedIndexInTab" :min="0" class="w-full" />
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.keepAlive')" :tip="$t('page.manage.menu.tips.keepAlive')" />
        </template>
        <NRadioGroup v-model:value="model.meta.keepAlive">
          <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
          <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.constant')" :tip="$t('page.manage.menu.tips.constant')" />
        </template>
        <NRadioGroup v-model:value="model.meta.constant">
          <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
          <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.hidden')" :tip="$t('page.manage.menu.tips.hidden')" />
        </template>
        <NRadioGroup v-model:value="model.meta.hideInMenu">
          <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
          <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem>
        <template #label>
          <FormLabel :label="$t('page.manage.menu.multiTab')" :tip="$t('page.manage.menu.tips.multiTab')" />
        </template>
        <NRadioGroup v-model:value="model.meta.multiTab">
          <NRadio :value="true">{{ $t('common.yesOrNo.yes') }}</NRadio>
          <NRadio :value="false">{{ $t('common.yesOrNo.no') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem class="col-span-2">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.query')" :tip="$t('page.manage.menu.tips.query')" />
        </template>
        <NDynamicInput v-model:value="model.meta.query" :on-create="createKeyValueItem">
          <template #default="{ value }">
            <div class="w-full flex gap-8px">
              <NInput v-model:value="value.key" :placeholder="$t('page.manage.menu.queryKey')" />
              <NInput v-model:value="value.value" :placeholder="$t('page.manage.menu.queryValue')" />
            </div>
          </template>
        </NDynamicInput>
      </NFormItem>
      <NFormItem class="col-span-2">
        <template #label>
          <FormLabel :label="$t('page.manage.menu.props')" :tip="$t('page.manage.menu.tips.props')" />
        </template>
        <NDynamicInput v-model:value="model.props" :on-create="createKeyValueItem">
          <template #default="{ value }">
            <div class="w-full flex gap-8px">
              <NInput v-model:value="value.key" :placeholder="$t('page.manage.menu.queryKey')" />
              <NInput v-model:value="value.value" :placeholder="$t('page.manage.menu.queryValue')" />
            </div>
          </template>
        </NDynamicInput>
      </NFormItem>
    </template>
  </FormDialog>
</template>
