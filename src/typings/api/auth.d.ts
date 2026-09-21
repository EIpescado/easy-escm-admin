declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      accessToken: string;
      expireIn: number;
    }

    /** The current login organization */
    interface OrgInfo {
      id: string;
      code: string;
      name: string;
      state: number;
    }

    /** The raw user fields returned by `/user/info` */
    interface UserBaseInfo {
      id: string;
      nickname: string;
      avatar: string;
      phone: string;
      mail: string;
      clientId: string;
      deviceType: string;
    }

    /** The response of `/user/info` */
    interface UserContext {
      user: UserBaseInfo;
      roles: string[];
      org: OrgInfo | null;
    }

    /** The front-end auth store user info */
    interface UserInfo extends UserBaseInfo {
      roles: string[];
      buttons: string[];
      org: OrgInfo;
    }
  }
}
