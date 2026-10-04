import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { $t } from '@/locales';

/** Backend `system_button.position` values used by the management pages */
export const BUTTON_POSITION = {
  /** Toolbar buttons, e.g. add */
  top: 'top',
  /** Row action buttons, e.g. edit / reset password */
  row: 'row'
} as const;

/**
 * Localized label of a backend button
 *
 * The button ships its own `i18nKey`; fall back to the backend `name` when it is missing.
 */
export function getButtonLabel(button: Api.SystemManage.ButtonNode) {
  return button.i18nKey ? $t(button.i18nKey as App.I18n.I18nKey) : button.name;
}

/**
 * Buttons of the current route, provided by the backend menu tree (`meta.buttons`)
 *
 * The backend groups them by `system_button.position`, e.g.:
 *
 * ```json
 * { "top": [{ "name": "新增", "click": "create" }], "row": [{ "name": "编辑", "click": "edit" }] }
 * ```
 */
export function usePageButtons() {
  const route = useRoute();

  const buttons = computed<Record<string, Api.SystemManage.ButtonNode[]>>(() => route.meta.buttons ?? {});

  /** Toolbar buttons */
  const toolbarButtons = computed(() => buttons.value[BUTTON_POSITION.top] ?? []);

  /** Row action buttons */
  const rowButtons = computed(() => buttons.value[BUTTON_POSITION.row] ?? []);

  return {
    buttons,
    toolbarButtons,
    rowButtons
  };
}

/** Button position, mirrors the backend `system_button.position` */
export type PageButtonPosition = (typeof BUTTON_POSITION)[keyof typeof BUTTON_POSITION];

/**
 * Context passed to a button state rule
 *
 * @template Row the table row type
 */
export interface PageButtonStateContext<Row> {
  /**
   * The rows the button acts on
   *
   * - toolbar (top) button: the currently checked rows
   * - row button: the row itself (a single-element array)
   */
  rows: Row[];
  /** Where the button is rendered */
  position: PageButtonPosition;
}

/**
 * A rule that decides whether a button is disabled
 *
 * Return `true` to disable the button; `false`/`undefined` keeps it enabled.
 */
export type PageButtonStateRule<Row> = (context: PageButtonStateContext<Row>) => boolean | undefined;

/** Button state rules keyed by the backend button `click` code */
export type PageButtonStateRules<Row> = Record<string, PageButtonStateRule<Row>>;

/**
 * Resolve whether a button is disabled by the configured rules
 *
 * Unknown `click` codes (no rule) are always enabled.
 *
 * @param click backend button `click` code
 * @param rows checked rows (toolbar) or the single row (row button)
 * @param position button position
 * @param rules button state rules
 */
export function resolvePageButtonDisabled<Row>(
  click: string | undefined,
  rows: Row[],
  position: PageButtonPosition,
  rules?: PageButtonStateRules<Row>
) {
  if (!click) return false;

  const rule = rules?.[click];

  return Boolean(rule?.({ rows, position }));
}

/**
 * Create a configurable button state resolver
 *
 * The rules are keyed by the backend button `click` code and receive the checked rows (toolbar) or
 * the current row (row button), so a page can decide whether a button is operable.
 *
 * @example
 * ```ts
 * const { isDisabled } = usePageButtonState<Api.SystemManage.User>({
 *   enable: ({ rows }) => !rows.some(row => row.stateEnum !== 'NORMAL'),
 *   disable: ({ rows }) => !rows.some(row => row.stateEnum === 'NORMAL'),
 *   update: ({ rows }) => rows.length !== 1
 * });
 *
 * isDisabled('enable', [row], 'row'); // row button
 * isDisabled('enable', checkedRows.value, 'top'); // toolbar button
 * ```
 *
 * @param rules button state rules
 */
export function usePageButtonState<Row>(rules?: PageButtonStateRules<Row>) {
  function isDisabled(click: string | undefined, rows: Row[], position: PageButtonPosition = BUTTON_POSITION.row) {
    return resolvePageButtonDisabled(click, rows, position, rules);
  }

  return {
    rules,
    isDisabled
  };
}
