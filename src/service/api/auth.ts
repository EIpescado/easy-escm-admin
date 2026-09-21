import { request } from '../request';

/**
 * Login
 *
 * @param username User name
 * @param password Password
 */
export function fetchLogin(username: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      username,
      password,
      clientId: 'escm-pc-api',
      grantType: 'password',
      orgCode: 'HFY'
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserContext>({ url: '/user/info' });
}

/**
 * 登出
 */
export function fetchLogout() {
  return request<void>({
    url: '/auth/logout',
    method: 'post'
  });
}
