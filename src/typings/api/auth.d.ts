declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      accessToken: string;
      refreshToken: string;
      expireIn: number;
    }

    interface UserInfo {
      id: string;
      nickname: string;
      avatar: string;
      phone: string;
      mail: string;
      clientId: string;
      deviceType: string;
      roles: string[];
      buttons: string[];
    }
  }
}
