import { $t } from '@/locales';

/** Menu node type: root / directory / menu / button */
export type MenuNodeType = 'root' | 'directory' | 'menu' | 'button';

/** label i18n keys of the menu node types */
export const MENU_TYPE_LABEL_KEYS: Record<MenuNodeType, App.I18n.I18nKey> = {
  root: 'page.manage.menu.root',
  directory: 'page.manage.menu.directory',
  menu: 'page.manage.menu.menu',
  button: 'page.manage.menu.button'
};

/** tag type of the menu node types */
export const MENU_TYPE_TAG_TYPES = {
  root: 'default',
  directory: 'info',
  menu: 'success',
  button: 'warning'
} as const;

/** node type: button > root (component `root`) > directory (component `layout.base`) > menu */
export function getMenuNodeType(node: Api.SystemManage.MenuNode): MenuNodeType {
  if (node.beButton) return 'button';
  if (node.component === 'root') return 'root';
  if (node.component === 'layout.base') return 'directory';

  return 'menu';
}

/** localized label of a menu node: the i18n key first, falling back to the raw name */
export function getMenuNodeLabel(node: Api.SystemManage.MenuNode) {
  const i18nKey = node.meta?.i18nKey || node.i18nKey;

  return i18nKey ? $t(i18nKey as App.I18n.I18nKey) : node.name;
}
