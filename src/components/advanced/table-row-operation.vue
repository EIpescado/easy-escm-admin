<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NDropdown } from 'naive-ui';
import { $t } from '@/locales';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({
  name: 'TableRowOperation'
});

interface Operation {
  key: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  /** Iconify icon name */
  icon?: string;
}

interface Props {
  /** operation list */
  options: Operation[];
  /** max button count, will use a dropdown when options length is greater than it */
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  max: 2
});

interface Emits {
  (e: 'select', key: string): void;
}

const emit = defineEmits<Emits>();

const { SvgIconVNode } = useSvgIcon();

const isDropdown = computed(() => props.options.length > props.max);

const dropdownOptions = computed(() =>
  props.options.map(item => ({
    key: item.key,
    label: item.label,
    disabled: item.disabled,
    icon: SvgIconVNode({ icon: item.icon, fontSize: 16 })
  }))
);

function handleSelect(key: string) {
  emit('select', key);
}
</script>

<template>
  <div class="inline-flex flex-nowrap items-center gap-4px">
    <template v-if="!isDropdown">
      <NButton
        v-for="item in options"
        :key="item.key"
        size="small"
        ghost
        :type="item.danger ? 'error' : 'primary'"
        :disabled="item.disabled"
        @click="handleSelect(item.key)"
      >
        <template v-if="item.icon" #icon>
          <SvgIcon :icon="item.icon" />
        </template>
        {{ item.label }}
      </NButton>
    </template>
    <template v-else>
      <NDropdown :options="dropdownOptions" trigger="click" @select="handleSelect">
        <NButton size="small" ghost type="primary">
          {{ $t('common.action') }}
          <SvgIcon icon="mdi:chevron-down" class="ml-2px text-14px" />
        </NButton>
      </NDropdown>
    </template>
  </div>
</template>

<style scoped></style>
