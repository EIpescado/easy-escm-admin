import { request } from '../request';

/**
 * Paged search shared by every `/system/**` list
 *
 * They all take a `PageQo` and return a `PageResult<Row>`; only the url and the row type differ, so
 * the lists call this generic helper instead of each declaring its own fetch.
 */
export function fetchPageSearch<Row>(url: string, params: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Row>>({ url, method: 'post', data: params });
}

/** export a paged list as xlsx, the backend returns a file stream when `export` is true */
export function fetchPageExport(url: string, params: Api.SystemManage.PageQo) {
  return request<Blob, 'blob'>({
    url,
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

/**
 * Reset user password
 *
 * @param id user id
 * @param password the custom password to set
 */
export function fetchResetUserPassword(id: string, password: string) {
  return request<string>({ url: '/system/user/resetPassword', method: 'post', data: { id, password } });
}

/** enable/disable user */
export function fetchToggleUserState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/user/enable' : '/system/user/disable',
    method: 'post',
    data: { id }
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
  return request<Api.SystemManage.RoleOption[]>({ url: '/system/role/select', method: 'get' });
}

/** get the bound ids of a role; the set contains both menu ids and button ids */
export function fetchRoleMenuIds(roleId: string) {
  return request<string[]>({ url: '/system/role/menuAndButtonIds', method: 'post', data: { id: roleId } });
}

/** bind menus to role */
export function fetchBindRoleMenu(data: Api.SystemManage.RoleBindMenuForm) {
  return request<string>({ url: '/system/role/bind', method: 'post', data });
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

/** get the whole menu tree (all menus, for management) */
export function fetchGetMenuWholeTree() {
  return request<Api.SystemManage.MenuNode[]>({ url: '/system/menu/wholeTree' });
}

/**
 * Get a single menu node detail
 *
 * @param id menu id
 */
export function fetchGetMenuDetail(id: string) {
  return request<Api.SystemManage.MenuNode>({ url: '/system/menu/detail', method: 'post', data: { id } });
}

/**
 * Get a single button node detail
 *
 * @param id button id
 */
export function fetchGetButtonDetail(id: string) {
  return request<Api.SystemManage.MenuNode>({ url: '/system/button/detail', method: 'post', data: { id } });
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

/**
 * Enable/disable a menu node
 *
 * @param id menu id
 * @param enable whether to enable
 */
export function fetchToggleMenuState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/menu/enable' : '/system/menu/disable',
    method: 'post',
    data: { id }
  });
}

/** create button (system/button) */
export function fetchCreateButton(data: Api.SystemManage.ButtonForm) {
  return request<string>({ url: '/system/button', method: 'post', data });
}

/** update button */
export function fetchUpdateButton(data: Api.SystemManage.ButtonForm) {
  return request<string>({ url: '/system/button/update', method: 'post', data });
}

/**
 * Enable/disable a button node
 *
 * @param id button id
 * @param enable whether to enable
 */
export function fetchToggleButtonState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/button/enable' : '/system/button/disable',
    method: 'post',
    data: { id }
  });
}

/** dictionary search (paged) */
export function fetchDictSearch(data: Api.SystemManage.PageQo) {
  return request<Api.SystemManage.PageResult<Api.SystemManage.Dict>>({
    url: '/system/dict/search',
    method: 'post',
    data
  });
}

/**
 * Get a single dictionary detail
 *
 * @param id dictionary id
 */
export function fetchDictDetail(id: string) {
  return request<Api.SystemManage.DictForm>({ url: '/system/dict/detail', method: 'post', data: { id } });
}

/** create dictionary */
export function fetchCreateDict(data: Api.SystemManage.DictForm) {
  return request<string>({ url: '/system/dict', method: 'post', data });
}

/** update dictionary */
export function fetchUpdateDict(data: Api.SystemManage.DictForm) {
  return request<string>({ url: '/system/dict/update', method: 'post', data });
}

/**
 * Enable/disable a dictionary
 *
 * @param id dictionary id
 * @param enable whether to enable
 */
export function fetchToggleDictState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/dict/enable' : '/system/dict/disable',
    method: 'post',
    data: { id }
  });
}

/**
 * Get a single dictionary entry detail
 *
 * @param id entry id
 */
export function fetchDictEntryDetail(id: string) {
  return request<Api.SystemManage.DictEntryForm>({ url: '/system/dictEntry/detail', method: 'post', data: { id } });
}

/** create dictionary entry */
export function fetchCreateDictEntry(data: Api.SystemManage.DictEntryForm) {
  return request<string>({ url: '/system/dictEntry', method: 'post', data });
}

/** update dictionary entry */
export function fetchUpdateDictEntry(data: Api.SystemManage.DictEntryForm) {
  return request<string>({ url: '/system/dictEntry/update', method: 'post', data });
}

/**
 * Enable/disable a dictionary entry
 *
 * @param id entry id
 * @param enable whether to enable
 */
export function fetchToggleDictEntryState(id: string, enable: boolean) {
  return request<string>({
    url: enable ? '/system/dictEntry/enable' : '/system/dictEntry/disable',
    method: 'post',
    data: { id }
  });
}

/**
 * Get the dictionary relation of a user (owned dictionaries + all-dict flag)
 *
 * @param userId user id
 */
export function fetchUserDictDetail(userId: string) {
  return request<Api.SystemManage.UserDict>({
    url: '/system/dict/userDictDetail',
    method: 'post',
    data: { id: userId }
  });
}

/** add dictionaries to a user (already bound ones are ignored by the backend) */
export function fetchAddUserDict(data: Api.SystemManage.UserDictForm) {
  return request<string>({ url: '/system/dict/addUserDict', method: 'post', data });
}

/** remove dictionaries from a user */
export function fetchRemoveUserDict(data: Api.SystemManage.UserDictForm) {
  return request<string>({ url: '/system/dict/removeUserDict', method: 'post', data });
}

/** grant every dictionary to a user (drops the explicit relations first) */
export function fetchBindUserAllDict(data: Api.SystemManage.UserDictForm) {
  return request<string>({ url: '/system/dict/bindUserAllDict', method: 'post', data });
}

/** revoke the all-dictionaries grant of a user */
export function fetchRemoveUserAllDict(data: Api.SystemManage.UserDictForm) {
  return request<string>({ url: '/system/dict/removeUserAllDict', method: 'post', data });
}

/**
 * Entries of a dictionary
 *
 * Used for the enum-like select options of a page, e.g. the `system_file_tag` tags of the file
 * upload.
 */
export function fetchDictSelect(dictCode: string) {
  return request<Api.SystemManage.DictEntry[]>({ url: '/system/dict/select', method: 'get', params: { dictCode } });
}

/** uploads (and downloads) can be large, so they get a much longer timeout than the default 10s */
const FILE_TRANSFER_TIMEOUT = 10 * 60 * 1000;

/** simple upload of a small file; the file tag is required */
export function fetchFileUpload(data: Api.SystemManage.FileUploadForm) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('fileTag', data.fileTag);
  if (data.fileName) formData.append('fileName', data.fileName);
  if (data.bucket) formData.append('bucket', data.bucket);
  if (data.storeMode) formData.append('storeMode', data.storeMode);

  return request<Api.SystemManage.SystemFile>({
    url: '/system/file/upload',
    method: 'post',
    data: formData,
    timeout: FILE_TRANSFER_TIMEOUT
  });
}

/** check a chunked upload: instant-upload (秒传) hit and already uploaded chunks, for resume */
export function fetchFileCheckChunk(data: Api.SystemManage.FileChunkCheckForm) {
  return request<Api.SystemManage.FileChunkCheck>({ url: '/system/file/checkChunk', method: 'post', data });
}

/** upload a single chunk, its size must not exceed the `chunkSize` returned by `checkChunk` */
export function fetchFileChunkUpload(data: Api.SystemManage.FileChunkForm) {
  const formData = new FormData();
  formData.append('file', data.file, data.fileName || `chunk-${data.chunkIndex}`);
  formData.append('identifier', data.identifier);
  formData.append('chunkIndex', String(data.chunkIndex));
  formData.append('totalChunks', String(data.totalChunks));
  formData.append('fileTag', data.fileTag);
  if (data.fileName) formData.append('fileName', data.fileName);

  return request<string>({
    url: '/system/file/uploadChunk',
    method: 'post',
    data: formData,
    timeout: FILE_TRANSFER_TIMEOUT
  });
}

/** merge the uploaded chunks into the final file */
export function fetchFileMergeChunk(data: Api.SystemManage.FileChunkMergeForm) {
  return request<Api.SystemManage.SystemFile>({
    url: '/system/file/mergeChunk',
    method: 'post',
    data,
    timeout: FILE_TRANSFER_TIMEOUT
  });
}

/** download files by id; the backend zips them when more than one id is given */
export function fetchFileDownload(ids: string[]) {
  return request<Blob, 'blob'>({
    url: '/system/file/download',
    method: 'post',
    data: ids,
    responseType: 'blob',
    timeout: FILE_TRANSFER_TIMEOUT
  });
}
