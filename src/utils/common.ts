import { $t } from '@/locales';
import type { ConfigField } from '@/constants/third-config';

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

/**
 * Whether an html string carries no visible content
 *
 * Rich text fields hold markup even when the user typed nothing (e.g. `<p><br></p>`), so the plain
 * `required` rule would accept them; this checks the text and keeps embedded media as content.
 *
 * @param html html produced by the rich text editor
 */
export function isBlankHtml(html: string | null | undefined) {
  const value = html ?? '';

  // media / table content counts as content even without any text
  if (/<(img|video|audio|iframe|table)\b/i.test(value)) return false;

  return !value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

/** mask shown instead of a credential value in a list */
const CONFIG_MASK = '******';

/** keys that hold a credential, used when a config type has no field definition */
const SENSITIVE_CONFIG_KEY = /pass(word)?|secret|token|key/i;

/**
 * Summary of a config JSON for a list cell
 *
 * Pairs of `label: value` for the known fields of the type, with the credentials masked as `******`;
 * an unknown type (or a body that is not JSON) falls back to a masked `key: value` dump.
 *
 * @param config raw config JSON of the row
 * @param fields field definitions of the type, from {@link CHANNEL_CONFIG_FIELDS} / {@link TEMPLATE_CONFIG_FIELDS}
 */
export function formatConfigPreview(config: string | null | undefined, fields?: ConfigField[]) {
  const raw = (config ?? '').trim();

  if (!raw) return '';

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return raw;
  }

  if (!parsed || typeof parsed !== 'object') return raw;

  if (fields?.length) {
    return fields
      .map(field => {
        const value = parsed[field.key];

        if (value === null || value === undefined || value === '') return '';

        return `${$t(field.label)}: ${field.sensitive ? CONFIG_MASK : String(value)}`;
      })
      .filter(Boolean)
      .join('，');
  }

  return Object.entries(parsed)
    .map(([key, value]) => `${key}: ${SENSITIVE_CONFIG_KEY.test(key) ? CONFIG_MASK : String(value ?? '')}`)
    .join('，');
}
