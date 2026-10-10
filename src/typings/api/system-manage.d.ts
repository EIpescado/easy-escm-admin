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
      /**
       * Whether the item belongs to the mixed `like` keyword query
       *
       * Items are AND-ed by default; the ones flagged with `fast` are OR-ed instead, e.g. the
       * keyword `basic` over the `code` and `name` fields is sent as
       * `[{ prop: 'code', values: ['basic'], fast: true }, { prop: 'name', values: ['basic'], fast: true }]`
       * and the backend builds `(a.code like '%basic%' or a.name like '%basic%')`.
       *
       * Built from the `fast` fields of the advanced query filter, which are merged into a single
       * keyword condition on the frontend and expanded back into one item per field here.
       */
      fast?: boolean;
    }

    /** dynamic sort item, aligned with backend BaseQo.OrderByItem */
    interface OrderByItem {
      /** entity property name, same as `QoItem.prop` */
      prop: string;
      /** whether ascending, `null`/`undefined` is treated as ascending */
      asc?: boolean;
      /** table alias */
      alias?: string;
    }

    /** export field config, aligned with backend BaseQo.ExportItem */
    interface ExportItem {
      /** entity property name, same as `QoItem.prop` */
      prop: string;
      /** display label of the exported column */
      label?: string;
    }

    /** common page qo */
    interface PageQo {
      page: number;
      size: number;
      keyword?: string;
      items?: QueryItem[];
      /** dynamic sort, applied in order */
      orders?: OrderByItem[];
      /** whether to export: the backend returns an xlsx stream instead of JSON */
      export?: boolean;
      /** fields to export, only valid when `export` is true */
      exportItems?: ExportItem[];
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

    /** option returned by `/system/role/select` */
    interface RoleOption {
      /** role id (backend Long is serialized as string) */
      id: string;
      roleCode: string;
      roleName: string;
      remark?: string | null;
    }

    interface RoleBindMenuForm {
      id: string;
      menuIds: string[];
      buttonIds?: string[];
    }

    /** menu button node, aligned with backend SystemButton / ButtonNode */
    interface ButtonNode {
      /** button id (backend Long is serialized as string) */
      id: string;
      /** button label */
      name: string;
      /** i18n key of the button label */
      i18nKey?: string;
      /** sort number */
      sn?: number;
      /** iconify icon name */
      icon?: string;
      /** click handler name, the front-end dispatches actions by it */
      click?: string;
      /** parent menu id (backend Long is serialized as string) */
      pid?: string;
      /** button position, e.g. `top`(toolbar) / `row`(row action) */
      position?: string;
      /** whether enabled */
      enabled?: boolean;
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
      /** buttons of the menu, grouped by `system_button.position` */
      buttons?: Record<string, ButtonNode[]>;
    }

    interface MenuNode {
      id: string;
      pid: string;
      /** whether the node comes from `system_button` rather than `system_menu` */
      beButton?: boolean;
      /** component name (menu) / button name (button) */
      name: string;
      path: string;
      component: string;
      meta: MenuMeta | null;
      props: Record<string, unknown> | null;
      /** permission code of the node */
      permission?: string;
      /** permission codes of the node */
      permissions?: string[];
      /** button click action, only on button nodes */
      click?: string;
      /** button i18n key, only on button nodes */
      i18nKey?: string;
      /** button position, only on button nodes */
      position?: string;
      /** state label, e.g. `启用` / `禁用` */
      state?: string;
      /** state enum name, e.g. `ON` / `OFF` */
      stateEnum?: string;
      /** sort number */
      sn?: number;
      children?: MenuNode[];
    }

    /** menu form, aligned with backend SystemMenuFo */
    interface MenuForm {
      id?: string;
      /** parent id, root is `-1` */
      pid: string;
      /** component name, must be unique */
      name: string;
      path: string;
      component: string;
      /** route meta */
      meta: MenuMeta;
      /** props passed to the route component */
      props?: Record<string, unknown> | null;
      /** permission code of the menu */
      permission?: string;
      /** permission codes of the menu */
      permissions?: string[];
      /** sort number */
      sn: number;
    }

    /** button form, aligned with backend SystemButtonFo */
    interface ButtonForm {
      id?: string;
      name: string;
      /** owning menu id */
      menuId: string;
      sn: number;
      icon?: string;
      position?: string;
      click?: string;
      i18nKey?: string;
      /** permission code of the button */
      permission?: string;
      /** permission codes of the button */
      permissions?: string[];
    }

    interface MenuDeleteForm {
      menuIds: string[];
      buttonIds?: string[];
    }

    /** dictionary (system_dict), aligned with backend SystemDictTo */
    interface Dict {
      id: string;
      /** dictionary code */
      code: string;
      /** dictionary name */
      name: string;
      /** state label */
      state?: string;
      /** state enum name, e.g. `ON` / `OFF` */
      stateEnum?: string;
      /** remark */
      remark?: string | null;
      /** whether the dictionary needs authorization */
      whetherAuth?: boolean | null;
    }

    /** dictionary form, aligned with backend SystemDictFo */
    interface DictForm {
      id?: string;
      code: string;
      name: string;
      state?: string;
      remark?: string | null;
      whetherAuth: boolean;
    }

    /** dictionary entry (system_dict_entry), aligned with backend SystemDictEntryTo */
    interface DictEntry {
      id: string;
      /** entry code */
      code: string;
      /** owning dictionary id */
      pid?: string;
      val?: string | null;
      val2?: string | null;
      val3?: string | null;
      val4?: string | null;
      /** state label, e.g. `启用` / `禁用` */
      state?: string;
      /** state enum name, e.g. `ON` / `OFF` */
      stateEnum?: string;
      remark?: string | null;
      /** sort number */
      sn?: number | null;
    }

    /** dictionary entry form, aligned with backend SystemDictEntryFo */
    interface DictEntryForm {
      id?: string;
      code: string;
      /** owning dictionary id */
      pid?: string;
      val?: string | null;
      val2?: string | null;
      val3?: string | null;
      val4?: string | null;
      state?: string;
      remark?: string | null;
      sn?: number | null;
    }

    /** user-dictionary relation, aligned with backend SystemUserDictVo */
    interface UserDict {
      userId: string;
      /** whether the user owns all dictionaries */
      allDict?: boolean;
      /** dictionaries owned by the user (the backend field is `dictList`) */
      dictList: Dict[];
    }

    /** user-dictionary bind form, aligned with backend SystemUserDictFo */
    interface UserDictForm {
      userId: string;
      allDict?: boolean;
      dictIds?: string[];
    }
  }
}
