/**
 * Type declarations for `@wangeditor/editor-for-vue`
 *
 * The package ships its typings in `dist/src`, but its `exports` map has no `types` condition, so
 * TypeScript (moduleResolution: bundler) cannot resolve them. Only the two components used by the
 * app are declared here; the editor data types come from `@wangeditor/editor`.
 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue';
  import type { IDomEditor, IEditorConfig, IToolbarConfig, SlateDescendant } from '@wangeditor/editor';

  /** the wangEditor content area, `v-model` binds the html */
  export const Editor: DefineComponent<{
    mode?: string;
    defaultContent?: SlateDescendant[];
    defaultHtml?: string;
    defaultConfig?: Partial<IEditorConfig>;
    modelValue?: string;
  }>;

  /** the toolbar of an existing editor instance */
  export const Toolbar: DefineComponent<{
    editor?: IDomEditor;
    defaultConfig?: Partial<IToolbarConfig>;
    mode?: string;
  }>;
}
