<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
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
  /**
   * Number of skeleton rows shown while loading, until the form has been rendered once
   *
   * By default this is {@link DEFAULT_SKELETON_ROWS} rows. Set it for a very tall form (e.g. the menu
   * one), whose first loading state would otherwise be much shorter than the form. Once the form has
   * been rendered, the row count is estimated from its real height instead.
   */
  skeletonRows?: number;
  /**
   * Submit handler of the built-in confirm button
   *
   * It runs after the form passes validation and is awaited: the dialog keeps the button loading and
   * disabled until it settles, and ignores close attempts meanwhile, so a form can never be submitted
   * twice. Provide a `footer` slot to replace the built-in buttons.
   */
  submit?: () => Promise<void> | void;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', { default: false });

/** whether the dialog fills the viewport (also controllable via `v-model:fullscreen`) */
const fullscreen = defineModel<boolean>('fullscreen', { default: false });

const { formRef, validate, restoreValidation } = useNaiveForm();

/** whether the built-in confirm button is awaiting `submit` */
const submitting = ref(false);

/** skeleton rows shown while loading, until the form has been rendered once */
const DEFAULT_SKELETON_ROWS = 4;

/** a skeleton row is 34px tall with the `gap-20px` of the list below it */
const SKELETON_ROW_PITCH = 34 + 20;

/** height of the last rendered form, used to size the loading skeleton so switching in and out of loading does not resize the dialog */
const formHeight = ref(0);

const formContainerRef = ref<HTMLElement | null>(null);

// the observer only fires while the form is mounted, so the last height survives the loading state
useResizeObserver(formContainerRef, () => {
  const height = formContainerRef.value?.offsetHeight ?? 0;

  if (height) formHeight.value = height;
});

/** `skeletonRows` until the form has been rendered once, then approximate its height */
const skeletonRowCount = computed(() => {
  if (!formHeight.value) return props.skeletonRows ?? DEFAULT_SKELETON_ROWS;

  return Math.max(2, Math.round(formHeight.value / SKELETON_ROW_PITCH));
});

/** never let the skeleton be shorter than the form it stands in for */
const skeletonMinHeight = computed(() => (formHeight.value ? `${formHeight.value}px` : undefined));

/** restore the form methods so callers can keep binding `useNaiveForm`'s ref to this dialog */
defineExpose({
  validate,
  restoreValidation,
  invalidateLabelWidth: () => formRef.value?.invalidateLabelWidth()
});

/** ignore the close attempts (mask, Esc, close icon) while the submit is in flight */
function handleShowChange(value: boolean) {
  if (!value && submitting.value) return;

  visible.value = value;
}

function handleCancel() {
  if (submitting.value) return;

  visible.value = false;
}

/** the built-in confirm button: validate, then await the submit handler with a duplicate-click guard */
async function handleConfirm() {
  if (submitting.value) return;

  // set the flag before the first await, otherwise clicks landing in the same tick slip through
  submitting.value = true;

  try {
    await validate();

    await props.submit?.();
  } finally {
    submitting.value = false;
  }
}

// leave fullscreen when the dialog closes
watch(visible, val => {
  if (!val) {
    fullscreen.value = false;
    submitting.value = false;
  }
});
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="title"
    class="form-dialog"
    :class="{ 'form-dialog--fullscreen': fullscreen }"
    @update:show="handleShowChange"
  >
    <template #header-extra>
      <NButton quaternary circle size="small" @click="fullscreen = !fullscreen">
        <template #icon>
          <icon-mdi-fullscreen-exit v-if="fullscreen" />
          <icon-mdi-fullscreen v-else />
        </template>
      </NButton>
    </template>
    <div v-if="!loading" ref="formContainerRef">
      <NForm ref="formRef" v-bind="$attrs" label-placement="left" require-mark-placement="left" :label-width="110">
        <slot />
      </NForm>
    </div>
    <div
      v-else
      class="flex flex-col gap-20px py-4px"
      :style="skeletonMinHeight ? { minHeight: skeletonMinHeight } : undefined"
    >
      <div v-for="n in skeletonRowCount" :key="n" class="flex items-center gap-16px">
        <NSkeleton :sharp="false" :width="80" height="20px" class="shrink-0" />
        <NSkeleton :sharp="false" height="34px" class="flex-1" />
      </div>
    </div>
    <template #footer>
      <template v-if="!loading">
        <slot name="footer">
          <NSpace justify="end">
            <NButton :disabled="submitting" @click="handleCancel">{{ $t('common.cancel') }}</NButton>
            <NButton type="primary" :loading="submitting" :disabled="submitting" @click="handleConfirm">
              {{ $t('common.confirm') }}
            </NButton>
          </NSpace>
        </slot>
      </template>
    </template>
  </NModal>
</template>

<style>
/*
 * NModal focuses the first focusable element when it opens, which is this fullscreen button, so
 * naive-ui then paints its focus background (`--n-color-focus`, a grey block) on it and leaves it
 * there until the focus moves away. Skip that paint when the focus is not keyboard driven; a real
 * keyboard focus still matches `:focus-visible` and keeps its ring.
 *
 * Not a scoped style on purpose: the dialog is teleported and rendered by naive-ui, so none of its
 * elements carry this component's scope attribute.
 */
.form-dialog .n-card-header__extra .n-button:focus:not(:focus-visible) {
  background-color: transparent;
}
</style>
