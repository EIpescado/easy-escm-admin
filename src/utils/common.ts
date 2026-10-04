import { $t } from '@/locales';

/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label
  })) as CommonType.Option<keyof T, T[keyof T]>[];
}

/**
 * Translate options
 *
 * @param options
 */
export function translateOptions(options: CommonType.Option<string, App.I18n.I18nKey>[]) {
  return options.map(option => ({
    ...option,
    label: $t(option.label)
  }));
}

interface ConfirmDialogOptions {
  content: string;
  onConfirm: () => Promise<void> | void;
  title?: string;
  positiveText?: string;
  negativeText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Show a confirm dialog and disable its positive button while `onConfirm` is running.
 *
 * This prevents duplicate submissions (e.g. repeated enable/disable requests), which naive-ui's
 * discrete dialog API does not guard against by itself.
 *
 * @param options dialog options
 */
export function showConfirmDialog(options: ConfirmDialogOptions) {
  const { title, content, positiveText, negativeText, type = 'warning', onConfirm } = options;

  const dialog = window.$dialog?.[type]({
    title: title ?? $t('common.tip'),
    content,
    positiveText: positiveText ?? $t('common.confirm'),
    negativeText: negativeText ?? $t('common.cancel'),
    onPositiveClick: async () => {
      // a duplicate click while the action is in flight must neither run it again nor close the dialog
      if (dialog?.loading) return false;

      if (dialog) dialog.loading = true;

      try {
        await onConfirm();
      } finally {
        if (dialog) dialog.loading = false;
      }
    }
  });

  return dialog;
}

/**
 * Toggle html class
 *
 * @param className
 */
export function toggleHtmlClass(className: string) {
  function add() {
    document.documentElement.classList.add(className);
  }

  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove
  };
}
