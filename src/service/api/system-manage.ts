import { request } from '../request';

/** get user list */
export function fetchUserList(params: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Api.SystemManage.User>>({
    url: '/system/user/search',
    method: 'post',
    data: params
  });
}

/** export user list as xlsx, the backend returns a file stream when `export` is true */
export function fetchUserExport(params: Api.SystemManage.PageQo) {
  return request<Blob, 'blob'>({
    url: '/system/user/search',
    method: 'post',
    data: { ...params, export: true },
    responseType: 'blob'
  });
}

/** get user detail */
export function fetchUserDetail(id: string) {
  return request<Api.SystemManage.UserForm>({ url: '/system/user/detail', method: 'post', data: { id } });
}

/** create user */
export function fetchCreateUser(data: Api.SystemManage.UserForm) {
  return request<string>({ url: '/system/user', method: 'post', data });
}

/** update user */
export function fetchUpdateUser(data: Api.SystemManage.UserForm) {
  return request<string>({ url: '/system/user/update', method: 'post', data });
}

/** reset user password */
export function fetchResetUserPassword(id: string) {
  return request<string>({ url: '/system/user/resetPassword', method: 'post', data: { id } });
}

/** enable/disable user */
export function fetchToggleUserState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/user/enable' : '/system/user/disable',
    method: 'post',
    data: { id }
  });
}

/** get role list */
export function fetchRoleList(params: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Api.SystemManage.Role>>({
    url: '/system/role/search',
    method: 'post',
    data: params
  });
}

/** export role list as xlsx, the backend returns a file stream when `export` is true */
export function fetchRoleExport(params: Api.SystemManage.PageQo) {
  return request<Blob, 'blob'>({
    url: '/system/role/search',
    method: 'post',
    data: { ...params, export: true },
    responseType: 'blob'
  });
}

/** create role */
export function fetchCreateRole(data: Api.SystemManage.RoleForm) {
  return request<string>({ url: '/system/role', method: 'post', data });
}

/** update role */
export function fetchUpdateRole(data: Api.SystemManage.RoleForm) {
  return request<string>({ url: '/system/role/update', method: 'post', data });
}

/** get role selector options */
export function fetchRoleSelect() {
  return request<Api.SystemManage.Selector<string>[]>({ url: '/system/role/select', method: 'get' });
}

/** get role bound menu ids */
export function fetchRoleMenuIds(roleId: string) {
  return request<string[]>({ url: '/system/role/menuIds', method: 'post', data: { id: roleId } });
}

/** bind menus to role */
export function fetchBindRoleMenu(data: Api.SystemManage.RoleBindMenuForm) {
  return request<string>({ url: '/system/role/bindMenu', method: 'post', data });
}

/** enable/disable role */
export function fetchToggleRoleState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/role/enable' : '/system/role/disable',
    method: 'post',
    data: { id }
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.MenuNode[]>({ url: '/system/menu/tree' });
}

/** create menu */
export function fetchCreateMenu(data: Api.SystemManage.MenuForm) {
  return request<string>({ url: '/system/menu', method: 'post', data });
}

/** update menu */
export function fetchUpdateMenu(data: Api.SystemManage.MenuForm) {
  return request<string>({ url: '/system/menu/update', method: 'post', data });
}

/** delete menu */
export function fetchDeleteMenu(data: Api.SystemManage.MenuDeleteForm) {
  return request<string>({ url: '/system/menu/delete', method: 'post', data });
}
