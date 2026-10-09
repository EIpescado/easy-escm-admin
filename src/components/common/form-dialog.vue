<script setup lang="ts">
import { watch } from 'vue';
import { useNaiveForm } from '@/hooks/common/form';

defineOptions({
  name: 'FormDialog',
  inheritAttrs: false
});

interface Props {
  /** dialog title */
  title: string;
  /** show a skeleton while the edit detail is loading */
  loading?: boolean;
}

defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

/** whether the dialog fills the viewport (also controllable via `v-model:fullscreen`) */
const fullscreen = defineModel<boolean>('fullscreen', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();

/** restore the form methods so callers can keep binding `useNaiveForm`'s ref to this dialog */
defineExpose({
  validate,
  restoreValidation,
  invalidateLabelWidth: () => formRef.value?.invalidateLabelWidth()
});

// leave fullscreen when the dialog closes
watch(visible, val => {
  if (!val) fullscreen.value = false;
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="title"
    class="form-dialog"
    :class="{ 'form-dialog--fullscreen': fullscreen }"
  >
    <template #header-extra>
      <NButton quaternary circle size="small" @click="fullscreen = !fullscreen">
        <template #icon>
          <icon-mdi-fullscreen-exit v-if="fullscreen" />
          <icon-mdi-fullscreen v-else />
        </template>
      </NButton>
    </template>
    <NForm
      v-if="!loading"
      ref="formRef"
      v-bind="$attrs"
      label-placement="left"
      label-align="left"
      require-mark-placement="left"
      :label-width="110"
    >
      <slot />
    </NForm>
    <div v-else class="flex flex-col gap-20px py-4px">
      <div v-for="n in 4" :key="n" class="flex items-center gap-16px">
        <NSkeleton :width="80" height="20px" class="shrink-0" />
        <NSkeleton height="34px" class="flex-1" />
      </div>
    </div>
    <template #footer>
      <slot v-if="!loading" name="footer" />
    </template>
  </NModal>
</template>
