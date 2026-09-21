import type { RouteLocationNormalizedLoaded, RouteRecordRaw, _RouteRecordBase } from 'vue-router';
import type { ElegantConstRoute, LastLevelRouteKey, RouteKey, RouteMap } from '@elegant-router/types';
import { isDev } from '@/constants/env';
import { useSvgIcon } from '@/hooks/common/icon';
import { views as elegantViews } from '@/router/elegant/imports';
import { $t } from '@/locales';

/**
 * Filter auth routes by roles
 *
 * @param routes Auth routes
 * @param roles Roles
 */
export function filterAuthRoutesByRoles(routes: ElegantConstRoute[], roles: string[]) {
  return routes.flatMap(route => filterAuthRouteByRoles(route, roles));
}

/**
 * Filter auth route by roles
 *
 * @param route Auth route
 * @param roles Roles
 */
function filterAuthRouteByRoles(route: ElegantConstRoute, roles: string[]): ElegantConstRoute[] {
  const routeRoles = (route.meta && route.meta.roles) || [];

  // if the route's "roles" is empty, then it is allowed to access
  const isEmptyRoles = !routeRoles.length;

  // if the user's role is included in the route's "roles", then it is allowed to access
  const hasPermission = routeRoles.some(role => roles.includes(role));

  const filterRoute = { ...route };

  if (filterRoute.children?.length) {
    filterRoute.children = filterRoute.children.flatMap(item => filterAuthRouteByRoles(item, roles));
  }

  // Exclude the route if it has no children after filtering
  if (filterRoute.children?.length === 0) {
    return [];
  }

  return hasPermission || isEmptyRoles ? [filterRoute] : [];
}

/**
 * Filter routes by `isDev` of meta
 *
 * The route with `meta.isDev` set to true is only loaded in the development environment
 *
 * @param routes Auth routes
 */
export function filterRoutesByDev(routes: ElegantConstRoute[]) {
  // in the development environment, all routes are loaded
  if (isDev) {
    return routes;
  }

  return routes.flatMap(route => filterRouteByDev(route));
}

/**
 * Filter route by `isDev` of meta
 *
 * @param route Auth route
 */
function filterRouteByDev(route: ElegantConstRoute): ElegantConstRoute[] {
  // exclude the route configured with `meta.isDev` outside the development environment
  if (route.meta?.isDev) {
    return [];
  }

  const filterRoute = { ...route };

  if (filterRoute.children?.length) {
    filterRoute.children = filterRoute.children.flatMap(item => filterRouteByDev(item));
  }

  // Exclude the route if it has no children after filtering
  if (filterRoute.children?.length === 0) {
    return [];
  }

  return [filterRoute];
}

/**
 * sort route by order
 *
 * @param route route
 */
function sortRouteByOrder(route: ElegantConstRoute) {
  if (route.children?.length) {
    route.children.sort((next, prev) => (Number(next.meta?.order) || 0) - (Number(prev.meta?.order) || 0));
    route.children.forEach(sortRouteByOrder);
  }

  return route;
}

/**
 * sort routes by order
 *
 * @param routes routes
 */
export function sortRoutesByOrder(routes: ElegantConstRoute[]) {
  routes.sort((next, prev) => (Number(next.meta?.order) || 0) - (Number(prev.meta?.order) || 0));
  routes.forEach(sortRouteByOrder);

  return routes;
}

/**
 * Whether the route component is implemented in the front-end
 *
 * The backend menu may reference views that are not implemented yet (e.g. `view.manage_user-detail`),
 * those routes are skipped to avoid elegant-router throwing.
 *
 * @param component route component, e.g. `layout.base`, `view.manage_user`, `layout.base$view.home`
 */
function isRouteComponentExist(component: string) {
  if (!component) return false;

  return component.split('$').every(part => {
    if (part.startsWith('layout.')) {
      return ['base', 'blank'].includes(part.replace('layout.', ''));
    }

    if (part.startsWith('view.')) {
      const key = part.replace('view.', '');

      return Boolean((elegantViews as Record<string, unknown>)[key]);
    }

    return true;
  });
}

/**
 * Transform the backend menu tree to elegant routes
 *
 * @param nodes Backend menu tree nodes (from `/menu/tree`)
 */
export function transformMenuTreeToRoutes(nodes: Api.SystemManage.MenuNode[]): ElegantConstRoute[] {
  return nodes
    .filter(node => Boolean(node.name && node.component))
    .filter(node => {
      if (isRouteComponentExist(node.component)) return true;

      // eslint-disable-next-line no-console
      console.warn(`[route] skip menu "${node.name}": view component "${node.component}" not found`);

      return false;
    })
    .map(node => {
      const children = node.children?.length ? transformMenuTreeToRoutes(node.children) : [];

      const route = {
        name: node.name,
        path: node.path,
        component: node.component,
        props: node.props || undefined,
        meta: {
          ...node.meta,
          title: node.meta?.title || node.name
        },
        children: children.length ? children : undefined
      };

      return route as unknown as ElegantConstRoute;
    });
}

/**
 * Get global menus by auth routes
 *
 * @param routes Auth routes
 */
export function getGlobalMenusByAuthRoutes(routes: ElegantConstRoute[]) {
  const menus: App.Global.Menu[] = [];

  routes.forEach(route => {
    if (!route.meta?.hideInMenu) {
      const menu = getGlobalMenuByBaseRoute(route);

      if (route.children?.some(child => !child.meta?.hideInMenu)) {
        menu.children = getGlobalMenusByAuthRoutes(route.children);
      }

      menus.push(menu);
    }
  });

  return menus;
}

/**
 * Update locale of global menus
 *
 * @param menus
 */
export function updateLocaleOfGlobalMenus(menus: App.Global.Menu[]) {
  const result: App.Global.Menu[] = [];

  menus.forEach(menu => {
    const { i18nKey, label, children } = menu;

    const newLabel = i18nKey ? $t(i18nKey) : label;

    const newMenu: App.Global.Menu = {
      ...menu,
      label: newLabel
    };

    if (children?.length) {
      newMenu.children = updateLocaleOfGlobalMenus(children);
    }

    result.push(newMenu);
  });

  return result;
}

/**
 * Get global menu by route
 *
 * @param route
 */
function getGlobalMenuByBaseRoute(route: RouteLocationNormalizedLoaded | ElegantConstRoute) {
  const { SvgIconVNode } = useSvgIcon();

  const { name, path } = route;
  const { title, i18nKey, icon = import.meta.env.VITE_MENU_ICON, localIcon, iconFontSize } = route.meta ?? {};

  const label = i18nKey ? $t(i18nKey) : title!;

  const menu: App.Global.Menu = {
    key: name as string,
    label,
    i18nKey,
    routeKey: name as RouteKey,
    routePath: path as RouteMap[RouteKey],
    icon: SvgIconVNode({ icon, localIcon, fontSize: iconFontSize || 20 })
  };

  return menu;
}

/**
 * Get cache route names
 *
 * @param routes Vue routes (two levels)
 */
export function getCacheRouteNames(routes: RouteRecordRaw[]) {
  const cacheNames: LastLevelRouteKey[] = [];

  routes.forEach(route => {
    // only get last two level route, which has component
    route.children?.forEach(child => {
      if (child.component && child.meta?.keepAlive) {
        cacheNames.push(child.name as LastLevelRouteKey);
      }
    });
  });

  return cacheNames;
}

/**
 * Is route exist by route name
 *
 * @param routeName
 * @param routes
 */
export function isRouteExistByRouteName(routeName: RouteKey, routes: ElegantConstRoute[]) {
  return routes.some(route => recursiveGetIsRouteExistByRouteName(route, routeName));
}

/**
 * Recursive get is route exist by route name
 *
 * @param route
 * @param routeName
 */
function recursiveGetIsRouteExistByRouteName(route: ElegantConstRoute, routeName: RouteKey) {
  let isExist = route.name === routeName;

  if (isExist) {
    return true;
  }

  if (route.children && route.children.length) {
    isExist = route.children.some(item => recursiveGetIsRouteExistByRouteName(item, routeName));
  }

  return isExist;
}

/**
 * Get selected menu key path
 *
 * @param selectedKey
 * @param menus
 */
export function getSelectedMenuKeyPathByKey(selectedKey: string, menus: App.Global.Menu[]) {
  const keyPath: string[] = [];

  menus.some(menu => {
    const path = findMenuPath(selectedKey, menu);

    const find = Boolean(path?.length);

    if (find) {
      keyPath.push(...path!);
    }

    return find;
  });

  return keyPath;
}

/**
 * Find menu path
 *
 * @param targetKey Target menu key
 * @param menu Menu
 */
function findMenuPath(targetKey: string, menu: App.Global.Menu): string[] | null {
  const path: string[] = [];

  function dfs(item: App.Global.Menu): boolean {
    path.push(item.key);

    if (item.key === targetKey) {
      return true;
    }

    if (item.children) {
      for (const child of item.children) {
        if (dfs(child)) {
          return true;
        }
      }
    }

    path.pop();

    return false;
  }

  if (dfs(menu)) {
    return path;
  }

  return null;
}

/**
 * Transform menu to breadcrumb
 *
 * @param menu
 */
function transformMenuToBreadcrumb(menu: App.Global.Menu) {
  const { children, ...rest } = menu;

  const breadcrumb: App.Global.Breadcrumb = {
    ...rest
  };

  if (children?.length) {
    breadcrumb.options = children.map(transformMenuToBreadcrumb);
  }

  return breadcrumb;
}

/**
 * Get breadcrumbs by route
 *
 * @param route
 * @param menus
 */
export function getBreadcrumbsByRoute(
  route: RouteLocationNormalizedLoaded,
  menus: App.Global.Menu[]
): App.Global.Breadcrumb[] {
  const key = route.name as string;
  const activeKey = route.meta?.activeMenu;

  for (const menu of menus) {
    if (menu.key === key) {
      return [transformMenuToBreadcrumb(menu)];
    }

    if (menu.key === activeKey) {
      const ROUTE_DEGREE_SPLITTER = '_';

      const parentKey = key.split(ROUTE_DEGREE_SPLITTER).slice(0, -1).join(ROUTE_DEGREE_SPLITTER);

      const breadcrumbMenu = getGlobalMenuByBaseRoute(route);
      if (parentKey !== activeKey) {
        return [transformMenuToBreadcrumb(breadcrumbMenu)];
      }

      return [transformMenuToBreadcrumb(menu), transformMenuToBreadcrumb(breadcrumbMenu)];
    }

    if (menu.children?.length) {
      const result = getBreadcrumbsByRoute(route, menu.children);
      if (result.length > 0) {
        return [transformMenuToBreadcrumb(menu), ...result];
      }
    }
  }

  return [];
}

/**
 * Transform menu to searchMenus
 *
 * @param menus - menus
 * @param treeMap
 */
export function transformMenuToSearchMenus(menus: App.Global.Menu[], treeMap: App.Global.Menu[] = []) {
  if (menus && menus.length === 0) return [];
  return menus.reduce((acc, cur) => {
    if (!cur.children) {
      acc.push(cur);
    }
    if (cur.children && cur.children.length > 0) {
      transformMenuToSearchMenus(cur.children, treeMap);
    }
    return acc;
  }, treeMap);
}
