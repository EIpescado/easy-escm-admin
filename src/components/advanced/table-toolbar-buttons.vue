<script setup lang="ts">
import { getButtonLabel } from '@/hooks/business/page-buttons';

defineOptions({
  name: 'TableToolbarButtons'
});

interface Props {
  /** backend toolbar buttons (route meta.buttons.top) */
  buttons: Api.SystemManage.ButtonNode[];
  /**
   * Resolve whether a button is disabled
   *
   * The page decides this from the currently checked rows via the button state rules.
   */
  disabled?: (button: Api.SystemManage.ButtonNode) => boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: () => false
});

interface Emits {
  (e: 'select', button: Api.SystemManage.ButtonNode): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <!--
    The buttons must live in their own flex row: without it they become direct flex items of the
    header and a `justify-between` parent spreads them across the whole width.
  -->
  <div class="flex flex-wrap items-center gap-8px">
    <NButton
      v-for="button in buttons"
      :key="button.id"
      size="small"
      ghost
      type="primary"
      :disabled="disabled(button)"
      @click="emit('select', button)"
    >
      <template v-if="button.icon" #icon>
        <SvgIcon :icon="button.icon" />
      </template>
      {{ getButtonLabel(button) }}
    </NButton>
  </div>
</template>

<style scoped></style>
