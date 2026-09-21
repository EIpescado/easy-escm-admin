<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TreeOption } from 'naive-ui';
import { fetchBindRoleMenu, fetchGetMenuTree, fetchRoleMenuIds } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'MenuAuthModal'
});

interface Props {
  roleId: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const menuTree = ref<Api.SystemManage.MenuNode[]>([]);
const checkedKeys = ref<(string | number)[]>([]);

function transformNodes(nodes: Api.SystemManage.MenuNode[]): TreeOption[] {
  return nodes.map(node => ({
    key: node.id,
    label: node.meta?.title || node.name,
    children: node.children?.length ? transformNodes(node.children) : undefined
  }));
}

const treeData = computed(() => transformNodes(menuTree.value));

watch(visible, async val => {
  if (!val) return;

  const [{ data: tree }, { data: ids }] = await Promise.all([fetchGetMenuTree(), fetchRoleMenuIds(props.roleId)]);

  menuTree.value = tree || [];
  checkedKeys.value = ids || [];
});

async function handleSubmit() {
  const { error } = await fetchBindRoleMenu({ id: props.roleId, menuIds: checkedKeys.value as string[] });

  if (!error) {
    window.$message?.success($t('page.manage.role.menuAuthSuccess'));
    emit('submitted');
    visible.value = false;
  }
}
</script>

<template>
  <NModal v-model:show="visible" preset="card" :title="$t('page.manage.role.menuAuth')" class="w-480px">
    <NTree
      v-model:checked-keys="checkedKeys"
      :data="treeData"
      checkable
      cascade
      expand-on-click
      block-line
      class="h-400px overflow-auto"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
