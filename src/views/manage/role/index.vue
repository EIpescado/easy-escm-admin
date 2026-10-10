<script setup lang="ts">
import { computed, h, onBeforeUnmount, ref, watch, type VNode } from 'vue';
import type { TreeOption } from 'naive-ui';
import { NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { usePageButtons, type PageButtonStateRules } from '@/hooks/business/page-buttons';
import { useSvgIcon } from '@/hooks/common/icon';
import {
  fetchBindRoleMenu,
  fetchGetMenuWholeTree,
  fetchRoleExport,
  fetchRoleList,
  fetchRoleMenuIds,
  fetchToggleRoleState
} from '@/service/api';
import { roleStateOptions, roleStateRecord } from '@/constants/business';
import { showConfirmDialog, translateOptions } from '@/utils/common';
import {
  getMenuNodeLabel,
  getMenuNodeType,
  MENU_TYPE_LABEL_KEYS,
  MENU_TYPE_TAG_TYPES,
  type MenuNodeType
} from '@/utils/menu';
import { $t } from '@/locales';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import RoleOperateModal from './modules/role-operate-modal.vue';

defineOptions({
  name: 'ManageRole'
});

const searchFields = computed<QueryField[]>(() => [
  // the two identifying fields are merged into one keyword condition, OR-ed by the backend (`fast`)
  { prop: 'roleCode', label: $t('page.manage.role.roleCode'), fast: true },
  { prop: 'roleName', label: $t('page.manage.role.roleName'), fast: true },
  {
    prop: 'state',
    label: $t('page.manage.role.stateLabel'),
    valueType: 'select',
    types: ['eq'],
    options: translateOptions(roleStateOptions)
  }
]);

/** Right-hand panel buttons of the current route (position `left-top`) */
const { leftTopButtons } = usePageButtons();

/**
 * Button state rules, keyed by the backend button `click` code.
 *
 * Return `true` to disable a button. `rows` is the checked rows for a toolbar button, or the row
 * itself for a row button.
 */
const buttonStateRules: PageButtonStateRules<Api.SystemManage.Role> = {
  enable: ({ rows }) => !rows.some(row => row.stateEnum !== 'ON'),
  disable: ({ rows }) => !rows.some(row => row.stateEnum === 'ON'),
  update: ({ rows }) => rows.length !== 1
};

/** Data columns; the operate and the selection columns are added by the list */
const columns = computed<NaiveUI.TableColumn<Api.SystemManage.Role>[]>(() => [
  { key: 'roleCode', title: $t('page.manage.role.roleCode'), align: 'center', minWidth: 140 },
  { key: 'roleName', title: $t('page.manage.role.roleName'), align: 'center', minWidth: 140 },
  {
    key: 'state',
    title: $t('page.manage.role.stateLabel'),
    align: 'center',
    width: 100,
    render: row =>
      h(
        NTag,
        { type: row.stateEnum === 'ON' ? 'success' : 'error', size: 'small', bordered: false },
        { default: () => $t(roleStateRecord[row.stateEnum]) }
      )
  },
  { key: 'remark', title: $t('page.manage.role.remark'), align: 'center', minWidth: 160 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}

/** the list exposes `getData` and the loaded rows to the page */
interface ManageListInstance {
  getData: () => Promise<void>;
  data: Api.SystemManage.Role[];
}

const listRef = ref<ManageListInstance | null>(null);

/** rows currently loaded in the list */
const rows = computed(() => listRef.value?.data ?? []);

async function refreshList() {
  await listRef.value?.getData();
}

const { bool: drawerVisible, setTrue: openDrawer, setFalse: closeDrawer } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingData = ref<Api.SystemManage.Role | null>(null);

/** the operate modal edits a `RoleForm` */
const editRow = computed(() => editingData.value as unknown as Api.SystemManage.RoleForm | null);

/** currently selected role (left list), drives the right-hand menu permission tree */
const activeRoleId = ref('');
const activeRoleName = ref('');

/** whether the selected role's bound menus are being loaded into the tree */
const menuLoading = ref(false);

/** whole menu tree (management tree), used by the right-hand permission panel */
const menuTree = ref<Api.SystemManage.MenuNode[]>([]);
const checkedKeys = ref<(string | number)[]>([]);

const { SvgIconVNode } = useSvgIcon();

/** tree option enriched with the node type and icon for rendering */
interface MenuTreeOption extends TreeOption {
  nodeType: MenuNodeType;
  icon?: (() => VNode) | null;
}

function transformNodes(nodes: Api.SystemManage.MenuNode[]): MenuTreeOption[] {
  return nodes.map(node => {
    const icon =
      SvgIconVNode({ icon: node.meta?.icon, fontSize: 16 }) ??
      SvgIconVNode({ localIcon: node.meta?.localIcon, fontSize: 16 });

    return {
      key: node.id,
      label: getMenuNodeLabel(node),
      nodeType: getMenuNodeType(node),
      icon,
      children: node.children?.length ? transformNodes(node.children) : undefined
    };
  });
}

const treeData = computed(() => transformNodes(menuTree.value));

/** render a tree node label: icon + localized (i18n key first) label */
function renderMenuNodeLabel({ option }: { option: TreeOption }) {
  const node = option as MenuTreeOption;
  const children: VNode[] = [];

  if (node.icon) children.push(h(node.icon));
  children.push(h('span', String(option.label ?? '')));

  return h('span', { class: 'inline-flex items-center gap-6px' }, children);
}

/** render the node type tag (root / directory / menu / button) */
function renderMenuNodeSuffix({ option }: { option: TreeOption }) {
  const node = option as MenuTreeOption;

  return h(
    NTag,
    { size: 'tiny', bordered: false, type: MENU_TYPE_TAG_TYPES[node.nodeType] },
    { default: () => $t(MENU_TYPE_LABEL_KEYS[node.nodeType]) }
  );
}

/** id -> node / id -> parent id, built from the whole menu tree */
const menuNodeMaps = computed(() => {
  const nodeMap = new Map<string, Api.SystemManage.MenuNode>();
  const parentMap = new Map<string, string>();

  function walk(nodes: Api.SystemManage.MenuNode[], parentId: string) {
    nodes.forEach(node => {
      nodeMap.set(node.id, node);

      if (parentId) parentMap.set(node.id, parentId);
      if (node.children?.length) walk(node.children, node.id);
    });
  }

  walk(menuTree.value, '');

  return { nodeMap, parentMap };
});

/** debounce delay before loading the bound ids of a selected role */
const LOAD_MENU_IDS_DELAY = 600;

/** debounce timer for the menu/button ids request, so clicking several rows in a row fires one request */
let loadMenuIdsTimer: ReturnType<typeof setTimeout> | undefined;

function clearLoadMenuIdsTimer() {
  if (loadMenuIdsTimer !== undefined) {
    clearTimeout(loadMenuIdsTimer);
    loadMenuIdsTimer = undefined;
  }
}

/** load the bound ids (menus + buttons) of a role as the checked keys */
async function loadRoleMenuIds(roleId: string) {
  try {
    const { data: ids } = await fetchRoleMenuIds(roleId);

    // ignore stale responses when the selection changed while loading
    if (activeRoleId.value !== roleId) return;

    // the backend returns both menu ids and button ids; the tree checks exactly these
    checkedKeys.value = ids || [];
  } finally {
    // only stop spinning for the role that is still selected
    if (activeRoleId.value === roleId) {
      menuLoading.value = false;
    }
  }
}

/**
 * Select a role and load its bound ids (menus + buttons) as the checked keys
 *
 * The request is debounced ({@link LOAD_MENU_IDS_DELAY}ms) so rapidly clicking several rows only fires
 * one request, for the last selected role.
 */
function selectRole(row: Api.SystemManage.Role) {
  activeRoleId.value = row.id;
  activeRoleName.value = row.roleName;
  menuLoading.value = true;

  clearLoadMenuIdsTimer();
  loadMenuIdsTimer = setTimeout(() => {
    loadMenuIdsTimer = undefined;
    loadRoleMenuIds(row.id);
  }, LOAD_MENU_IDS_DELAY);
}

onBeforeUnmount(clearLoadMenuIdsTimer);

/** highlight the selected role row and select it on click */
function rowClassName(row: Api.SystemManage.Role) {
  return row.id === activeRoleId.value ? 'role-row--active' : '';
}

function rowProps(row: Api.SystemManage.Role) {
  return {
    style: 'cursor: pointer',
    onClick: (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // ignore clicks on the selection checkbox / row action buttons
      if (target.closest('.n-checkbox') || target.closest('.n-button')) return;

      selectRole(row);
    }
  };
}

/** clear the selection when the selected role is no longer in the list (e.g. after filtering / paging) */
watch(
  rows,
  loaded => {
    if (!loaded.some(row => row.id === activeRoleId.value)) {
      activeRoleId.value = '';
      checkedKeys.value = [];
      clearLoadMenuIdsTimer();
      menuLoading.value = false;
    }
  },
  { immediate: true }
);

/** load the whole menu tree for the permission panel */
async function getMenuTree() {
  const { data: tree } = await fetchGetMenuWholeTree();

  menuTree.value = tree || [];
}

getMenuTree();

/** save the checked menus & buttons to the selected role, including the ancestors of the checked nodes */
async function handleBindMenu() {
  if (!activeRoleId.value) {
    window.$message?.warning($t('page.manage.role.selectRole'));

    return;
  }

  const { nodeMap, parentMap } = menuNodeMaps.value;
  const ids = new Set(checkedKeys.value.map(String));

  // include every ancestor so that a checked leaf also authorizes its parent menus
  const queue = Array.from(ids);

  while (queue.length) {
    const parentId = parentMap.get(queue.pop() as string);

    if (parentId && !ids.has(parentId)) {
      ids.add(parentId);
      queue.push(parentId);
    }
  }

  // menus and buttons are submitted separately
  const menuIds: string[] = [];
  const buttonIds: string[] = [];

  ids.forEach(id => {
    const node = nodeMap.get(id);

    if (!node) return;

    if (node.beButton) buttonIds.push(id);
    else menuIds.push(id);
  });

  const { error } = await fetchBindRoleMenu({ id: activeRoleId.value, menuIds, buttonIds });

  if (!error) {
    window.$message?.success($t('page.manage.role.menuAuthSuccess'));
  }
}

/** Open the add form with a clean model (clear the previously edited row) */
function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openDrawer();
}

function handleEdit(row: Api.SystemManage.Role) {
  operateType.value = 'edit';
  editingData.value = row;
  openDrawer();
}

function handleSetState(row: Api.SystemManage.Role, enable: boolean) {
  showConfirmDialog({
    content: $t(enable ? 'page.manage.role.enableConfirm' : 'page.manage.role.disableConfirm', { name: row.roleName }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await fetchToggleRoleState(row.id, enable);

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await refreshList();
      }
    }
  });
}

/** Row action handlers, dispatched by the backend button `click` */
const rowActionHandlers: Record<string, (row: Api.SystemManage.Role) => void> = {
  update: handleEdit,
  enable: row => handleSetState(row, true),
  disable: row => handleSetState(row, false)
};

function handleRowAction(row: Api.SystemManage.Role, key: string) {
  const handler = rowActionHandlers[key];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Toolbar buttons (position `top`), text comes from the backend button `name` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { create: handleAdd };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Right-hand panel buttons (position `left-top`), dispatched by the backend button `click` */
function handleLeftTopAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = { bindMenu: handleBindMenu, save: handleBindMenu };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/**
 * Every right-hand button writes the checked menus, so they all wait for the current load to finish
 * (otherwise they could save the previously selected role's menus by mistake)
 */
function isMenuAuthButtonDisabled() {
  return menuLoading.value;
}

async function handleSubmitted() {
  closeDrawer();
  await refreshList();
}
</script>

<template>
  <div class="min-h-0 flex flex-1 gap-16px overflow-hidden">
    <ManageList
      ref="listRef"
      table-key="manage_role"
      class="min-w-0 min-h-0 flex-[6]"
      :api="fetchRoleList"
      :export-api="fetchRoleExport"
      :fields="searchFields"
      :columns="getColumns"
      :button-rules="buttonStateRules"
      :row-class-name="rowClassName"
      :row-props="rowProps"
      :row-action="handleRowAction"
      selection
      sortable
      @toolbar-action="handleToolbarAction"
    />
    <NCard :bordered="false" size="small" class="menu-auth-card min-w-0 min-h-0 flex-[4] card-wrapper">
      <template #header>
        <div class="min-w-0 flex items-center justify-between gap-8px">
          <span class="truncate">
            {{
              activeRoleId ? `${$t('page.manage.role.menuAuth')} · ${activeRoleName}` : $t('page.manage.role.menuAuth')
            }}
          </span>
          <TableToolbarButtons
            :buttons="leftTopButtons"
            :disabled="isMenuAuthButtonDisabled"
            @select="handleLeftTopAction"
          />
        </div>
      </template>
      <NSpin v-if="activeRoleId" :show="menuLoading" class="h-full min-h-0" content-class="h-full min-h-0">
        <div class="h-full min-h-0 overflow-auto">
          <NTree
            v-model:checked-keys="checkedKeys"
            :data="treeData"
            :render-label="renderMenuNodeLabel"
            :render-suffix="renderMenuNodeSuffix"
            checkable
            expand-on-click
            block-line
          />
        </div>
      </NSpin>
      <NEmpty v-else class="mt-80px" :description="$t('page.manage.role.selectRole')" />
    </NCard>
    <RoleOperateModal
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row="editRow"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped>
/* the selected role row */
:deep(.role-row--active .n-data-table-td) {
  background-color: var(--n-td-color-hover, rgba(0, 0, 0, 0.04));
}

/* let the right-hand menu tree fill and scroll inside the card; naive-ui renders `.n-card-content` */
.menu-auth-card :deep(.n-card-content) {
  min-height: 0;
}
</style>
