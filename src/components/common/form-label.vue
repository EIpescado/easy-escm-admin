<script setup lang="ts">
defineOptions({
  name: 'FormLabel'
});

interface Props {
  label: string;
  /** optional field explanation shown via the `?` tooltip */
  tip?: string;
}

defineProps<Props>();
</script>

<template>
  <span class="flex w-full min-w-0 items-center justify-end gap-2px">
    <!--
      The tip icon sits BEFORE the label: the whole row is right aligned, so keeping the icon on the
      left leaves the label text flush with the right edge whether there is a tip or not.
    -->
    <NTooltip v-if="tip" trigger="hover">
      <template #trigger>
        <icon-mdi-help-circle-outline class="shrink-0 cursor-help text-14px text-#999" />
      </template>
      <span class="max-w-260px leading-normal">{{ tip }}</span>
    </NTooltip>
    <NTooltip trigger="hover">
      <template #trigger>
        <span class="min-w-0 truncate">{{ label }}</span>
      </template>
      {{ label }}
    </NTooltip>
  </span>
</template>

<style scoped></style>
