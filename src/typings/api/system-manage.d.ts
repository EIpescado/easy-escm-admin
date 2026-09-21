declare namespace Api {
  /**
   * namespace SystemManage
   *
   * easy-escm system management api
   */
  namespace SystemManage {
    /** pagination result, aligned with backend PageR */
    interface PageResult<T> {
      page: number;
      size: number;
      pages: number;
      total: number;
      rows: T[];
    }

    /** selector option */
    interface Selector<T = string> {
      label: string;
      value: T;
    }

    /** dynamic query item, aligned with backend BaseQo.QoItem */
    interface QueryItem {
      prop: string;
      label?: string;
      values: string[];
      type?: string;
      alias?: string;
    }

    /** common page qo */
    interface PageQo {
      page: number;
      size: number;
      keyword?: string;
      items?: QueryItem[];
    }

    /** user */
    interface User {
      id: string;
      username: string;
      nickname: string;
      avatar: string | null;
      mail: string | null;
      phone: string | null;
      registerTime: string | null;
      activateTime: string | null;
      state: string;
      stateEnum: 'NORMAL' | 'FORBIDDEN' | 'NOT_ACTIVATED';
      lastLoginIp: string | null;
      lastLoginTime: string | null;
    }

    interface UserForm {
      id?: string;
      username: string;
      nickname: string;
      phone?: string;
      mail?: string;
      roleIds: string[];
    }

    interface UserSearchModel {
      username: string;
      nickname: string;
      phone: string;
      state: string | null;
    }

    interface RoleSearchModel {
      roleCode: string;
      roleName: string;
    }

    /** role */
    interface Role {
      id: string;
      roleCode: string;
      roleName: string;
      state: string;
      stateEnum: 'ON' | 'OFF';
      remark: string | null;
    }

    interface RoleForm {
      id?: string;
      roleCode: string;
      roleName: string;
      remark?: string;
    }

    interface RoleBindMenuForm {
      id: string;
      menuIds: string[];
      buttonIds?: string[];
    }

    /** menu tree node */
    interface MenuMeta {
      title?: string;
      i18nKey?: string;
      roles?: string[];
      keepAlive?: boolean;
      constant?: boolean;
      icon?: string;
      localIcon?: string;
      iconFontSize?: number;
      order?: number;
      href?: string;
      hideInMenu?: boolean;
      activeMenu?: string;
      multiTab?: boolean;
      fixedIndexInTab?: number;
      query?: { key: string; value: string }[];
      buttons?: Record<string, unknown>;
    }

    interface MenuNode {
      id: string;
      pid: string;
      name: string;
      path: string;
      component: string;
      meta: MenuMeta | null;
      props: Record<string, unknown> | null;
      enabled: boolean;
      children?: MenuNode[];
    }

    interface MenuForm {
      id?: string;
      pid: string;
      title: string;
      routerName: string;
      component: string;
      path: string;
      query?: string;
      icon?: string;
      cached?: boolean;
      hidden?: boolean;
      activeMenu?: string;
      iFrame?: boolean;
      sortNo: number;
    }

    interface MenuDeleteForm {
      menuIds: string[];
      buttonIds?: string[];
    }
  }
}
