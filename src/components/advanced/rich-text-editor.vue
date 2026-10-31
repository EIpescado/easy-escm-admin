<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

defineOptions({
  name: 'RichTextEditor'
});

interface Props {
  /** hint shown while the editor is empty */
  placeholder?: string;
  /** editor height in px */
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  height: 300
});

/** the html content, used as `v-model` */
const model = defineModel<string>({ default: '' });

/** the editor instance, the toolbar needs it and the destroy hook keeps it */
const editorRef = shallowRef<IDomEditor>();

/** video uploads need a server endpoint, so the whole group is left out */
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video']
};

/**
 * Editor config
 *
 * Images are embedded as base64 (up to 5 MB) instead of being uploaded, because no upload endpoint
 * is wired to the editor; a larger file falls back to wangEditor's default upload and reports an
 * error instead of silently doing nothing.
 */
const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      base64LimitSize: 5 * 1024 * 1024
    }
  }
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

// wangEditor binds DOM listeners outside Vue, they must be released explicitly
onBeforeUnmount(() => {
  editorRef.value?.destroy();
});
</script>

<template>
  <div class="rich-text-editor w-full">
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" class="border-b border-gray-200" />
    <Editor
      v-model="model"
      :default-config="editorConfig"
      :style="{ height: `${height}px` }"
      mode="default"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid var(--n-border-color);
  border-radius: 3px;
  /* keep the editor menus above the dialog body, but clip the corners of the toolbar */
  overflow: hidden;
}
</style>
