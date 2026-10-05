<script setup lang="ts">
import { computed, h, ref, watch, type VNode } from 'vue';
import { NButton, NEllipsis, NSpace, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import {
  fetchDeleteMenu,
  fetchGetButtonDetail,
  fetchGetMenuDetail,
  fetchGetMenuWholeTree,
  fetchToggleButtonState,
  fetchToggleMenuState
} from '@/service/api';
import {
  getButtonLabel,
  usePageButtonState,
  usePageButtons,
  type PageButtonStateRules
} from '@/hooks/business/page-buttons';
import { useSvgIcon } from '@/hooks/common/icon';
import { showConfirmDialog } from '@/utils/common';
import { getTableOperateColumnWidth } from '@/utils/table';
import { $t } from '@/locales';
import {
  isConditionFilled,
  type QueryField,
  type QueryFilterCondition
} from '@/components/advanced/query-filter/types';
import QueryFilter from '@/components/advanced/query-filter/index.vue';
import TableRowOperation from '@/components/advanced/table-row-operation.vue';
import MenuOperateModal from './modules/menu-operate-modal.vue';

defineOptions({
  name: 'ManageMenu'
});

const { SvgIconVNode } = useSvgIcon();

/** stateEnum values that mean enabled; any other non-empty value is treated as disabled */
const ENABLED_STATE_ENUMS = new Set(['ON', 'NORMAL', 'ENABLE', 'ENABLED', 'Y', '1']);

/** whether a menu/button node is enabled, based on `stateEnum` (`ON` / `OFF`) */
function isMenuEnabled(row: Api.SystemManage.MenuNode) {
  const { stateEnum } = row;

  return stateEnum ? ENABLED_STATE_ENUMS.has(String(stateEnum).toUpperCase()) : true;
}

/** Menu node type: root / directory / menu / button */
type MenuNodeType = 'root' | 'directory' | 'menu' | 'button';

/** label i18n keys of the menu node types */
const MENU_TYPE_LABEL_KEYS: Record<MenuNodeType, App.I18n.I18nKey> = {
  root: 'page.manage.menu.root',
  directory: 'page.manage.menu.directory',
  menu: 'page.manage.menu.menu',
  button: 'page.manage.menu.button'
};

/** tag type of the menu node types */
const MENU_TYPE_TAG_TYPES = {
  root: 'default',
  directory: 'info',
  menu: 'success',
  button: 'warning'
} as const;

/** node type: button > root (component `root`) > directory (component `layout.base`) > menu */
function getMenuNodeType(row: Api.SystemManage.MenuNode): MenuNodeType {
  if (row.beButton) return 'button';
  if (row.component === 'root') return 'root';
  if (row.component === 'layout.base') return 'directory';

  return 'menu';
}

const loading = ref(false);
const menuTree = ref<Api.SystemManage.MenuNode[]>([]);

const rootPid = computed(() => menuTree.value[0]?.pid ?? '0');

async function getData() {
  loading.value = true;

  const { data, error } = await fetchGetMenuWholeTree();

  if (!error) {
    menuTree.value = data || [];
  }

  loading.value = false;
}

getData();

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'title',
    label: $t('page.manage.menu.title'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like', 'eq', 'ne']
  },
  {
    prop: 'menuName',
    label: $t('page.manage.menu.menuName'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like', 'eq', 'ne']
  },
  {
    prop: 'name',
    label: $t('page.manage.menu.name'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like', 'eq', 'ne']
  },
  {
    prop: 'path',
    label: $t('page.manage.menu.path'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like', 'eq', 'ne']
  },
  {
    prop: 'component',
    label: $t('page.manage.menu.component'),
    valueType: 'text',
    defaultType: 'like',
    types: ['like', 'eq', 'ne']
  },
  {
    prop: 'type',
    label: $t('page.manage.menu.type'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq', 'ne'],
    options: [
      { label: $t('page.manage.menu.root'), value: 'root' },
      { label: $t('page.manage.menu.directory'), value: 'directory' },
      { label: $t('page.manage.menu.menu'), value: 'menu' },
      { label: $t('page.manage.menu.button'), value: 'button' }
    ]
  },
  {
    prop: 'state',
    label: $t('page.manage.menu.status'),
    valueType: 'select',
    defaultType: 'eq',
    types: ['eq', 'ne'],
    options: [
      { label: $t('page.manage.menu.enabled'), value: 'ON' },
      { label: $t('page.manage.menu.disabled'), value: 'OFF' }
    ]
  }
]);

const searchConditions = ref<QueryFilterCondition[]>([]);

/** Conditions applied to the front-end filter (captured on search) */
const appliedConditions = ref<QueryFilterCondition[]>([]);

function handleSearch() {
  appliedConditions.value = searchConditions.value
    .filter(isConditionFilled)
    .map(condition => ({ ...condition, values: [...condition.values] }));
}

function handleReset() {
  appliedConditions.value = [];
}

/** Read the field value of a menu/button node for the front-end filter */
function getMenuNodeFieldValue(node: Api.SystemManage.MenuNode, prop: string): string {
  switch (prop) {
    case 'title':
      return node.meta?.title || node.name || '';
    case 'menuName': {
      const i18nKey = node.meta?.i18nKey || node.i18nKey;

      return i18nKey ? $t(i18nKey as App.I18n.I18nKey) : '';
    }
    case 'name':
      return node.name || '';
    case 'path':
      return node.path || '';
    case 'component':
      return node.component || '';
    case 'type':
      return getMenuNodeType(node);
    case 'state':
      return isMenuEnabled(node) ? 'ON' : 'OFF';
    default:
      return '';
  }
}

/** Whether a node satisfies a single query condition */
function matchMenuCondition(node: Api.SystemManage.MenuNode, condition: QueryFilterCondition) {
  const fieldValue = getMenuNodeFieldValue(node, condition.prop).toLowerCase();
  const values = condition.values.map(value => String(value).toLowerCase());

  switch (condition.type) {
    case 'eq':
      return fieldValue === values[0];
    case 'ne':
      return fieldValue !== values[0];
    case 'like':
      return fieldValue.includes(values[0] ?? '');
    case 'notLike':
      return !fieldValue.includes(values[0] ?? '');
    case 'in':
      return values.includes(fieldValue);
    case 'notIn':
      return !values.includes(fieldValue);
    default:
      return true;
  }
}

/** Whether a node satisfies all applied conditions */
function matchMenuNode(node: Api.SystemManage.MenuNode, conditions: QueryFilterCondition[]) {
  return conditions.every(condition => matchMenuCondition(node, condition));
}

/** Filter the menu tree by the applied conditions, keeping matched nodes and the ancestors of matched nodes */
function filterMenuTree(
  nodes: Api.SystemManage.MenuNode[],
  conditions: QueryFilterCondition[]
): Api.SystemManage.MenuNode[] {
  return nodes.reduce<Api.SystemManage.MenuNode[]>((acc, node) => {
    // keep the matched node together with its whole subtree
    if (matchMenuNode(node, conditions)) {
      acc.push(node);

      return acc;
    }

    const matchedChildren = node.children?.length ? filterMenuTree(node.children, conditions) : [];

    if (matchedChildren.length) {
      acc.push({ ...node, children: matchedChildren });
    }

    return acc;
  }, []);
}

/** Menu tree filtered by the applied conditions (front-end only) */
const filteredMenuTree = computed(() =>
  appliedConditions.value.length ? filterMenuTree(menuTree.value, appliedConditions.value) : menuTree.value
);

/** ids of all nodes in a tree, used to expand the tree table */
function collectMenuKeys(nodes: Api.SystemManage.MenuNode[]): string[] {
  return nodes.flatMap(node => [node.id, ...(node.children?.length ? collectMenuKeys(node.children) : [])]);
}

/** expanded row keys of the tree table, kept in sync with the filtered data */
const expandedRowKeys = ref<string[]>([]);

/** whether the tree has rendered once; the tree stays collapsed when first entering the page */
const menuTreeRendered = ref(false);

watch(
  filteredMenuTree,
  nodes => {
    // keep the tree collapsed on the first load; expand all afterwards (e.g. after filtering / refreshing)
    if (!nodes.length) {
      expandedRowKeys.value = [];

      return;
    }

    expandedRowKeys.value = menuTreeRendered.value ? collectMenuKeys(nodes) : [];
    menuTreeRendered.value = true;
  },
  { immediate: true }
);

/** expand all tree nodes */
function expandAllMenus() {
  expandedRowKeys.value = collectMenuKeys(filteredMenuTree.value);
}

/** collapse all tree nodes */
function collapseAllMenus() {
  expandedRowKeys.value = [];
}

/** Buttons of the current route, provided by the backend menu tree */
const { toolbarButtons, rowButtons } = usePageButtons();

/**
 * Button state rules.
 *
 * - `enable` / `disable`: disabled when the node is already in that state
 * - `create` / `createSubMenu`: only allowed under a directory or a root
 * - `createButton`: only allowed under a menu
 * - `editMenu`: allowed under a directory or a menu
 * - `editButton`: only allowed under a button
 */
const menuButtonStateRules: PageButtonStateRules<Api.SystemManage.MenuNode> = {
  enable: ({ rows }) => rows.every(row => isMenuEnabled(row)),
  disable: ({ rows }) => rows.every(row => !isMenuEnabled(row)),
  create: ({ rows }) => rows.some(row => !['directory', 'root'].includes(getMenuNodeType(row))),
  createSubMenu: ({ rows }) => rows.some(row => !['directory', 'root'].includes(getMenuNodeType(row))),
  createButton: ({ rows }) => rows.some(row => getMenuNodeType(row) !== 'menu'),
  editMenu: ({ rows }) => rows.some(row => getMenuNodeType(row) === 'button'),
  editButton: ({ rows }) => rows.some(row => getMenuNodeType(row) !== 'button')
};

const { isDisabled: isButtonDisabled } = usePageButtonState(menuButtonStateRules);

const { bool: modalVisible, setTrue: openModal, setFalse: closeModal } = useBoolean();
const operateType = ref<NaiveUI.TableOperateType>('add');
const editingRow = ref<Api.SystemManage.MenuNode | null>(null);
const parentId = ref<string>(rootPid.value);
/** whether the add form is creating a button instead of a menu */
const addButtonMode = ref(false);
/** whether the add form is creating a top-level menu (platform root, `pid` empty and component `root`) */
const addTopMenuMode = ref(false);

function handleAdd(row?: Api.SystemManage.MenuNode) {
  operateType.value = 'add';
  addButtonMode.value = false;
  addTopMenuMode.value = false;
  editingRow.value = null;
  parentId.value = row?.id ?? rootPid.value;
  openModal();
}

/** add a top-level menu: `pid` is empty and the component is fixed to `root` */
function handleCreateTopMenu() {
  operateType.value = 'add';
  addButtonMode.value = false;
  addTopMenuMode.value = true;
  editingRow.value = null;
  parentId.value = '';
  openModal();
}

/** add a button under the given menu */
function handleAddButton(row: Api.SystemManage.MenuNode) {
  operateType.value = 'add';
  addButtonMode.value = true;
  addTopMenuMode.value = false;
  editingRow.value = null;
  parentId.value = row.id;
  openModal();
}

/** load the node detail from the backend before opening the edit form */
async function handleEdit(row: Api.SystemManage.MenuNode) {
  const { data, error } = await (row.beButton ? fetchGetButtonDetail(row.id) : fetchGetMenuDetail(row.id));

  if (error || !data) return;

  operateType.value = 'edit';
  addButtonMode.value = false;
  addTopMenuMode.value = false;
  editingRow.value = data;
  parentId.value = data.pid;
  openModal();
}

function handleDelete(row: Api.SystemManage.MenuNode) {
  // button nodes are deleted via `buttonIds`, menu nodes via `menuIds`
  const payload: Api.SystemManage.MenuDeleteForm = row.beButton
    ? { menuIds: [], buttonIds: [row.id] }
    : { menuIds: [row.id] };

  showConfirmDialog({
    content: $t('common.confirmDelete'),
    onConfirm: async () => {
      const { error } = await fetchDeleteMenu(payload);

      if (!error) {
        window.$message?.success($t('common.deleteSuccess'));
        await getData();
      }
    }
  });
}

function handleSetState(row: Api.SystemManage.MenuNode, enable: boolean) {
  const name = row.meta?.title || row.name;

  showConfirmDialog({
    content: $t(enable ? 'page.manage.menu.enableConfirm' : 'page.manage.menu.disableConfirm', { name }),
    positiveText: $t(enable ? 'common.confirmEnable' : 'common.confirmDisable'),
    onConfirm: async () => {
      const { error } = await (row.beButton
        ? fetchToggleButtonState(row.id, enable)
        : fetchToggleMenuState(row.id, enable));

      if (!error) {
        window.$message?.success($t('common.updateSuccess'));
        await getData();
      }
    }
  });
}

/** Row action handlers, dispatched by the backend button `click` */
const rowActionHandlers: Record<string, (row: Api.SystemManage.MenuNode) => void> = {
  create: row => handleAdd(row),
  createSubMenu: row => handleAdd(row),
  createButton: handleAddButton,
  update: handleEdit,
  edit: handleEdit,
  editMenu: handleEdit,
  editButton: handleEdit,
  enable: row => handleSetState(row, true),
  disable: row => handleSetState(row, false),
  delete: handleDelete
};

function handleRowAction(row: Api.SystemManage.MenuNode, key: string) {
  const handler = rowActionHandlers[key];

  if (handler) {
    handler(row);
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

/** Toolbar buttons (position `top`), dispatched by the backend button `click` */
function handleToolbarAction(button: Api.SystemManage.ButtonNode) {
  const handlers: Record<string, () => void> = {
    create: () => handleAdd(),
    createTopMenu: handleCreateTopMenu
  };

  const handler = handlers[button.click ?? ''];

  if (handler) {
    handler();
  } else {
    window.$message?.info($t('common.lookForward'));
  }
}

async function handleSubmitted() {
  closeModal();
  await getData();
}

function getOperateOptions(row: Api.SystemManage.MenuNode) {
  return rowButtons.value.map(button => ({
    key: button.click ?? button.name,
    label: getButtonLabel(button),
    danger: button.click === 'delete',
    disabled: isButtonDisabled(button.click, [row], 'row'),
    icon: button.icon || undefined
  }));
}

const operateColumnWidth = computed(() =>
  getTableOperateColumnWidth(
    rowButtons.value.map(button => getButtonLabel(button)),
    2,
    28
  )
);

const columns = computed<NaiveUI.TableColumn<Api.SystemManage.MenuNode>[]>(() => {
  const tableColumns: NaiveUI.TableColumn<Api.SystemManage.MenuNode>[] = [];

  tableColumns.push({
    key: 'title',
    title: $t('page.manage.menu.title'),
    minWidth: 200,
    // used to keep the tree indent / expand trigger, the type tag and the title on a single line
    className: 'menu-title-cell',
    // type tag merged with the title
    render: (row: Api.SystemManage.MenuNode) => {
      const type = getMenuNodeType(row);

      return h('div', { class: 'menu-title-content inline-flex items-center gap-6px align-middle' }, [
        h(
          NTag,
          { type: MENU_TYPE_TAG_TYPES[type], size: 'small', bordered: false, class: 'shrink-0' },
          { default: () => $t(MENU_TYPE_LABEL_KEYS[type]) }
        ),
        h(NEllipsis, { tooltip: true, class: 'min-w-0' }, { default: () => row.meta?.title || row.name })
      ]);
    }
  });

  // hide the operate column when the route has no row buttons
  if (rowButtons.value.length) {
    tableColumns.push({
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: operateColumnWidth.value,
      render: (row: Api.SystemManage.MenuNode) =>
        h(TableRowOperation, {
          options: getOperateOptions(row),
          onSelect: (key: string) => handleRowAction(row, key)
        })
    });
  }

  tableColumns.push(
    {
      key: 'menuName',
      title: $t('page.manage.menu.menuName'),
      minWidth: 200,
      // icon(s) merged with the (translated) menu name
      render: (row: Api.SystemManage.MenuNode) => {
        const i18nKey = row.meta?.i18nKey || row.i18nKey;
        const label = i18nKey ? $t(i18nKey as App.I18n.I18nKey) : '';

        const iconNodes: VNode[] = [];
        const icon = SvgIconVNode({ icon: row.meta?.icon, fontSize: 18 });
        const localIcon = SvgIconVNode({ localIcon: row.meta?.localIcon, fontSize: 18 });

        if (icon) iconNodes.push(h(icon));
        if (localIcon) iconNodes.push(h(localIcon));

        // hide the placeholder dash when the node only has icon(s) but no name
        if (label) iconNodes.push(h('span', label));
        else if (!iconNodes.length) iconNodes.push(h('span', '-'));

        return h('div', { class: 'flex items-center gap-6px' }, iconNodes);
      }
    },
    {
      key: 'i18nKey',
      title: $t('page.manage.menu.i18nKey'),
      minWidth: 180,
      // keep on a single line and show a tooltip when overflowing
      render: (row: Api.SystemManage.MenuNode) =>
        h(NEllipsis, { tooltip: true }, { default: () => row.meta?.i18nKey || row.i18nKey || '-' })
    },
    {
      key: 'name',
      title: $t('page.manage.menu.name'),
      minWidth: 140,
      render: (row: Api.SystemManage.MenuNode) => row.name
    },
    {
      key: 'path',
      title: $t('page.manage.menu.path'),
      minWidth: 180,
      // buttons have no path; show their click action instead; keep on a single line and show a tooltip when overflowing
      render: (row: Api.SystemManage.MenuNode) => {
        const text = row.beButton ? row.click || '-' : row.path || '-';

        return h(NEllipsis, { tooltip: true }, { default: () => text });
      }
    },
    {
      key: 'component',
      title: $t('page.manage.menu.component'),
      minWidth: 200,
      // keep on a single line and show a tooltip when overflowing
      render: (row: Api.SystemManage.MenuNode) =>
        h(NEllipsis, { tooltip: true }, { default: () => row.component || '-' })
    },
    {
      key: 'permission',
      title: $t('page.manage.menu.permission'),
      minWidth: 160,
      // keep on a single line and show a tooltip when overflowing
      render: (row: Api.SystemManage.MenuNode) =>
        h(NEllipsis, { tooltip: true }, { default: () => row.permission || '-' })
    },
    {
      key: 'status',
      title: $t('page.manage.menu.status'),
      width: 90,
      align: 'center',
      render: (row: Api.SystemManage.MenuNode) =>
        h(
          NTag,
          { type: isMenuEnabled(row) ? 'success' : 'error', size: 'small', bordered: false },
          { default: () => $t(isMenuEnabled(row) ? 'page.manage.menu.enabled' : 'page.manage.menu.disabled') }
        )
    },
    {
      key: 'hidden',
      title: $t('page.manage.menu.hidden'),
      width: 90,
      align: 'center',
      render: (row: Api.SystemManage.MenuNode) => {
        if (row.beButton) {
          return '-';
        }

        const hidden = Boolean(row.meta?.hideInMenu);

        return h(
          NTag,
          { type: hidden ? 'warning' : 'success', size: 'small', bordered: false },
          { default: () => $t(hidden ? 'common.yesOrNo.yes' : 'common.yesOrNo.no') }
        );
      }
    },
    {
      key: 'order',
      title: $t('page.manage.menu.order'),
      width: 80,
      align: 'center',
      render: (row: Api.SystemManage.MenuNode) => row.meta?.order ?? row.sn ?? '-'
    }
  );

  return tableColumns;
});
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <QueryFilter
      v-model="searchConditions"
      :fields="searchFields"
      class="shrink-0"
      @search="handleSearch"
      @reset="handleReset"
    />
    <NCard :bordered="false" size="small" class="min-h-0 flex-1 card-wrapper">
      <template #header>
        <div class="flex items-center justify-between">
          <NSpace>
            <TableToolbarButtons :buttons="toolbarButtons" @select="handleToolbarAction" />
          </NSpace>
          <NSpace>
            <NButton size="small" @click="expandAllMenus">
              <template #icon>
                <icon-mdi-arrow-expand-all class="text-icon" />
              </template>
              {{ $t('page.manage.menu.expandAll') }}
            </NButton>
            <NButton size="small" @click="collapseAllMenus">
              <template #icon>
                <icon-mdi-arrow-collapse-all class="text-icon" />
              </template>
              {{ $t('page.manage.menu.collapseAll') }}
            </NButton>
            <NButton size="small" :loading="loading" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
              {{ $t('common.refresh') }}
            </NButton>
          </NSpace>
        </div>
      </template>
      <NDataTable
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredMenuTree"
        :loading="loading"
        :row-key="row => row.id"
        flex-height
        class="h-full"
      />
    </NCard>
    <MenuOperateModal
      v-model:visible="modalVisible"
      :operate-type="operateType"
      :row="editingRow"
      :add-button="addButtonMode"
      :add-top-menu="addTopMenuMode"
      :parent-id="parentId"
      :root-pid="rootPid"
      :tree="menuTree"
      @submitted="handleSubmitted"
    />
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  height: 48px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  vertical-align: middle;
}

/* align the tree expand arrow with the inline cell content */
:deep(.n-data-table-expand-trigger),
:deep(.n-data-table-expand-placeholder) {
  vertical-align: middle;
}

/* keep the tree indent / expand trigger, the type tag and the title on a single line */
:deep(.n-data-table-td.menu-title-cell) {
  white-space: nowrap;
}

/* reserve room for the tree indent + expand trigger so the tag/title box can never wrap below them */
:deep(.menu-title-content) {
  max-width: calc(100% - var(--indent-offset, 0) * 16px - 24px);
}
</style>
