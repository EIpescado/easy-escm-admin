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

/** i18n keys of the known backend button `click` values */
const BUTTON_LABEL_KEYS: Record<string, App.I18n.I18nKey> = {
  add: 'button.add',
  search: 'button.search',
  update: 'button.update',
  resetPassword: 'button.resetPassword',
  enable: 'button.enable',
  disable: 'button.disable',
  detail: 'button.detail',
  orgList: 'button.orgList',
  bindMenu: 'button.bindMenu',
  menuAuth: 'button.bindMenu',
  menuIds: 'button.menuIds',
  select: 'button.roleSelect'
};

/**
 * Localized label of a backend button
 *
 * The backend only ships a single (Chinese) `name`, so the front-end maps the known `click`
 * actions to i18n keys; unknown actions fall back to the backend `name`.
 */
export function getButtonLabel(button: Api.SystemManage.ButtonNode) {
  const key = button.click ? BUTTON_LABEL_KEYS[button.click] : undefined;

  return key ? $t(key) : button.name;
}

/**
 * Buttons of the current route, provided by the backend menu tree (`meta.buttons`)
 *
 * The backend groups them by `system_button.position`, e.g.:
 *
 * ```json
 * { "top": [{ "name": "新增", "click": "add" }], "row": [{ "name": "编辑", "click": "edit" }] }
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
