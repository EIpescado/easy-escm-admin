import { request } from '../request';

/** get user list */
export function fetchUserList(params: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Api.SystemManage.User>>({
    url: '/user/search',
    method: 'post',
    data: params
  });
}

/** get user detail */
export function fetchUserDetail(id: string) {
  return request<Api.SystemManage.UserForm>({ url: '/user/detail', method: 'post', data: { id } });
}

/** create user */
export function fetchCreateUser(data: Api.SystemManage.UserForm) {
  return request<string>({ url: '/user', method: 'post', data });
}

/** update user */
export function fetchUpdateUser(data: Api.SystemManage.UserForm) {
  return request<string>({ url: '/user/update', method: 'post', data });
}

/** reset user password */
export function fetchResetUserPassword(id: string) {
  return request<string>({ url: '/user/resetPassword', method: 'post', data: { id } });
}

/** enable/disable user */
export function fetchToggleUserState(id: string, enable: boolean) {
  return request<string>({ url: enable ? '/user/enable' : '/user/disable', method: 'post', data: { id } });
}

/** get role list */
export function fetchRoleList(params: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Api.SystemManage.Role>>({
    url: '/role/search',
    method: 'post',
    data: params
  });
}

/** create role */
export function fetchCreateRole(data: Api.SystemManage.RoleForm) {
  return request<string>({ url: '/role', method: 'post', data });
}

/** update role */
export function fetchUpdateRole(data: Api.SystemManage.RoleForm) {
  return request<string>({ url: '/role/update', method: 'post', data });
}

/** get role selector options */
export function fetchRoleSelect() {
  return request<Api.SystemManage.Selector<string>[]>({ url: '/role/select', method: 'get' });
}

/** get role bound menu ids */
export function fetchRoleMenuIds(roleId: string) {
  return request<string[]>({ url: '/role/menuIds', method: 'post', data: { id: roleId } });
}

/** bind menus to role */
export function fetchBindRoleMenu(data: Api.SystemManage.RoleBindMenuForm) {
  return request<string>({ url: '/role/bindMenu', method: 'post', data });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuNode[]>({ url: '/menu/tree' });
}

/** create menu */
export function fetchCreateMenu(data: Api.SystemManage.MenuForm) {
  return request<string>({ url: '/menu', method: 'post', data });
}

/** update menu */
export function fetchUpdateMenu(data: Api.SystemManage.MenuForm) {
  return request<string>({ url: '/menu/update', method: 'post', data });
}

/** delete menu */
export function fetchDeleteMenu(data: Api.SystemManage.MenuDeleteForm) {
  return request<string>({ url: '/menu/delete', method: 'post', data });
}
