import { request } from '../request';

/** get the current user's menu routes from backend */
export function fetchGetUserRoutes() {
  return request<Api.SystemManage.MenuNode[]>({ url: '/menu/tree', params: { rootId: 1 } });
}
