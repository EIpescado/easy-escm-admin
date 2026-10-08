const local: App.I18n.Schema = {
  system: {
    title: 'EasyEscmAdmin',
    updateTitle: 'System Version Update Notification',
    updateContent: 'A new version of the system has been detected. Do you want to refresh the page immediately?',
    updateConfirm: 'Refresh immediately',
    updateCancel: 'Later',
    user: {
      resetPassword: 'Reset Password'
    },
    role: {
      bindMenu: 'Assign Permissions'
    },
    menu: {
      createSubMenu: 'Create Submenu',
      createTopMenu: 'Create Top Menu',
      edit: 'Edit Menu'
    },
    button: {
      create: 'Create Button',
      edit: 'Edit Button'
    }
  },
  common: {
    action: 'Action',
    add: 'Add',
    addSuccess: 'Add Success',
    back: 'Back',
    backToHome: 'Back to home',
    batchDelete: 'Batch Delete',
    cancel: 'Cancel',
    close: 'Close',
    check: 'Check',
    selectAll: 'Select All',
    expandColumn: 'Expand Column',
    columnSetting: 'Column Setting',
    config: 'Config',
    confirm: 'Confirm',
    confirmEnable: 'Confirm Enable',
    confirmDisable: 'Confirm Disable',
    create: 'Create',
    delete: 'Delete',
    deleteSuccess: 'Delete Success',
    confirmDelete: 'Are you sure you want to delete?',
    disable: 'Disable',
    edit: 'Edit',
    enable: 'Enable',
    warning: 'Warning',
    error: 'Error',
    export: 'Export',
    index: 'Index',
    keywordSearch: 'Please enter keyword',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    lookForward: 'Coming soon',
    modify: 'Modify',
    modifySuccess: 'Modified successfully',
    more: 'More',
    noData: 'No Data',
    operate: 'Operate',
    pleaseCheckValue: 'Please check whether the value is valid',
    refresh: 'Refresh',
    reset: 'Reset',
    search: 'Search',
    switch: 'Switch',
    tip: 'Tip',
    trigger: 'Trigger',
    update: 'Update',
    updateSuccess: 'Update Success',
    userCenter: 'User Center',
    yesOrNo: {
      yes: 'Yes',
      no: 'No'
    }
  },
  request: {
    logout: 'Logout user after request failed',
    logoutMsg: 'User status is invalid, please log in again',
    logoutWithModal: 'Pop up modal after request failed and then log out user',
    logoutWithModalMsg: 'User status is invalid, please log in again',
    tokenExpired: 'The requested token has expired'
  },
  theme: {
    themeDrawerTitle: 'Theme Configuration',
    tabs: {
      appearance: 'Appearance',
      layout: 'Layout',
      general: 'General',
      preset: 'Preset'
    },
    appearance: {
      themeSchema: {
        title: 'Theme Schema',
        light: 'Light',
        dark: 'Dark',
        auto: 'Follow System'
      },
      grayscale: 'Grayscale',
      colourWeakness: 'Colour Weakness',
      themeColor: {
        title: 'Theme Color',
        primary: 'Primary',
        info: 'Info',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        followPrimary: 'Follow Primary'
      },
      themeRadius: {
        title: 'Theme Radius'
      },
      recommendColor: 'Apply Recommended Color Algorithm',
      recommendColorDesc: 'The recommended color algorithm refers to',
      preset: {
        title: 'Theme Presets',
        apply: 'Apply',
        applySuccess: 'Preset applied successfully',
        default: {
          name: 'Default Preset',
          desc: 'Default theme preset with balanced settings'
        },
        dark: {
          name: 'Dark Preset',
          desc: 'Dark theme preset for night time usage'
        },
        compact: {
          name: 'Compact Preset',
          desc: 'Compact layout preset for small screens'
        },
        azir: {
          name: "Azir's Preset",
          desc: 'It is a cold and elegant preset that Azir likes'
        }
      }
    },
    layout: {
      layoutMode: {
        title: 'Layout Mode',
        vertical: 'Vertical Mode',
        horizontal: 'Horizontal Mode',
        'vertical-mix': 'Vertical Mix Mode',
        'vertical-hybrid-header-first': 'Left Hybrid Header-First',
        'top-hybrid-sidebar-first': 'Top-Hybrid Sidebar-First',
        'top-hybrid-header-first': 'Top-Hybrid Header-First',
        vertical_detail: 'Vertical menu layout, with the menu on the left and content on the right.',
        'vertical-mix_detail':
          'Vertical mix-menu layout, with the primary menu on the dark left side and the secondary menu on the lighter left side.',
        'vertical-hybrid-header-first_detail':
          'Left hybrid layout, with the primary menu at the top, the secondary menu on the dark left side, and the tertiary menu on the lighter left side.',
        horizontal_detail: 'Horizontal menu layout, with the menu at the top and content below.',
        'top-hybrid-sidebar-first_detail':
          'Top hybrid layout, with the primary menu on the left and the secondary menu at the top.',
        'top-hybrid-header-first_detail':
          'Top hybrid layout, with the primary menu at the top and the secondary menu on the left.'
      },
      tab: {
        title: 'Tab Settings',
        visible: 'Tab Visible',
        cache: 'Tag Bar Info Cache',
        cacheTip: 'Keep the tab bar information after leaving the page',
        height: 'Tab Height',
        mode: {
          title: 'Tab Mode',
          slider: 'Slider',
          chrome: 'Chrome',
          button: 'Button'
        },
        closeByMiddleClick: 'Close Tab by Middle Click',
        closeByMiddleClickTip: 'Enable closing tabs by clicking with the middle mouse button'
      },
      header: {
        title: 'Header Settings',
        height: 'Header Height',
        breadcrumb: {
          visible: 'Breadcrumb Visible',
          showIcon: 'Breadcrumb Icon Visible'
        }
      },
      sider: {
        title: 'Sider Settings',
        inverted: 'Dark Sider',
        width: 'Sider Width',
        collapsedWidth: 'Sider Collapsed Width',
        mixWidth: 'Mix Sider Width',
        mixCollapsedWidth: 'Mix Sider Collapse Width',
        mixChildMenuWidth: 'Mix Child Menu Width',
        autoSelectFirstMenu: 'Auto Select First Submenu',
        autoSelectFirstMenuTip:
          'When a first-level menu is clicked, the first submenu is automatically selected and navigated to the deepest level'
      },
      footer: {
        title: 'Footer Settings',
        visible: 'Footer Visible',
        fixed: 'Fixed Footer',
        height: 'Footer Height',
        right: 'Right Footer'
      },
      content: {
        title: 'Content Area Settings',
        scrollMode: {
          title: 'Scroll Mode',
          tip: 'The theme scroll only scrolls the main part, the outer scroll can carry the header and footer together',
          wrapper: 'Wrapper',
          content: 'Content'
        },
        page: {
          animate: 'Page Animate',
          mode: {
            title: 'Page Animate Mode',
            fade: 'Fade',
            'fade-slide': 'Slide',
            'fade-bottom': 'Fade Zoom',
            'fade-scale': 'Fade Scale',
            'zoom-fade': 'Zoom Fade',
            'zoom-out': 'Zoom Out',
            none: 'None'
          }
        },
        fixedHeaderAndTab: 'Fixed Header And Tab'
      }
    },
    general: {
      title: 'General Settings',
      watermark: {
        title: 'Watermark Settings',
        visible: 'Watermark Full Screen Visible',
        text: 'Custom Watermark Text',
        enableusername: 'Enable User Name Watermark',
        enableTime: 'Show Current Time',
        timeFormat: 'Time Format'
      },
      multilingual: {
        title: 'Multilingual Settings',
        visible: 'Display multilingual button'
      },
      globalSearch: {
        title: 'Global Search Settings',
        visible: 'Display GlobalSearch button'
      }
    },
    configOperation: {
      copyConfig: 'Copy Config',
      copySuccessMsg: 'Copy Success, Please replace the variable "themeSettings" in "src/theme/settings.ts"',
      resetConfig: 'Reset Config',
      resetSuccessMsg: 'Reset Success'
    }
  },
  route: {
    login: 'Login',
    403: 'No Permission',
    404: 'Not Found',
    500: 'Server Error',
    'iframe-page': 'Iframe Page',
    home: 'Home',
    manage: 'System',
    manage_user: 'User',
    manage_role: 'Role',
    manage_menu: 'Menu',
    manage_dict: 'Dictionary',
    'manage_user-dict': 'User Dictionary',
    'manage_user-detail': 'User Detail'
  },
  page: {
    login: {
      common: {
        loginOrRegister: 'Login / Register',
        usernamePlaceholder: 'Please enter user name',
        phonePlaceholder: 'Please enter phone number',
        codePlaceholder: 'Please enter verification code',
        passwordPlaceholder: 'Please enter password',
        confirmPasswordPlaceholder: 'Please enter password again',
        codeLogin: 'Verification code login',
        confirm: 'Confirm',
        back: 'Back',
        validateSuccess: 'Verification passed',
        loginSuccess: 'Login successfully',
        welcomeBack: 'Welcome back, {username} !'
      },
      pwdLogin: {
        title: 'Password Login',
        rememberMe: 'Remember me',
        forgetPassword: 'Forget password?',
        register: 'Register',
        otherLoginMode: 'Other Login Mode'
      },
      codeLogin: {
        title: 'Verification Code Login',
        getCode: 'Get verification code',
        reGetCode: 'Reacquire after {time}s',
        sendCodeSuccess: 'Verification code sent successfully',
        imageCodePlaceholder: 'Please enter image verification code'
      },
      register: {
        title: 'Register',
        agreement: 'I have read and agree to',
        protocol: '《User Agreement》',
        policy: '《Privacy Policy》'
      },
      resetPwd: {
        title: 'Reset Password'
      },
      bindWeChat: {
        title: 'WeChat Login'
      }
    },
    manage: {
      user: {
        username: 'Username',
        nickname: 'Nickname',
        phone: 'Phone',
        mail: 'Email',
        role: 'Role',
        stateLabel: 'Status',
        lastLoginTime: 'Last Login Time',
        registerTime: 'Register Time',
        resetPassword: 'Reset Password',
        resetPasswordConfirm: 'Reset this user password to the default one?',
        resetPasswordTip: '6-18 characters, including letters, numbers and underscores',
        newPassword: 'New Password',
        newPasswordPlaceholder: 'Please enter the new password',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Please enter the new password again',
        enableConfirm: 'Enable user "{name}"?',
        disableConfirm: 'Disable user "{name}"?',
        state: {
          normal: 'Normal',
          forbidden: 'Disabled',
          notActivated: 'Not Activated'
        }
      },
      role: {
        roleCode: 'Role Code',
        roleName: 'Role Name',
        remark: 'Remark',
        stateLabel: 'Status',
        menuAuth: 'Menu Auth',
        menuAuthSuccess: 'Authorized successfully',
        selectRole: 'Select a role on the left',
        enableConfirm: 'Enable role "{name}"?',
        disableConfirm: 'Disable role "{name}"?',
        state: {
          on: 'Enabled',
          off: 'Disabled'
        }
      },
      menu: {
        parent: 'Parent Menu',
        name: 'Route Name',
        buttonName: 'Button Name',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        title: 'Menu Title',
        menuName: 'Menu Name',
        i18nKey: 'i18n Key',
        permission: 'Permission Code',
        type: 'Type',
        directory: 'Directory',
        menu: 'Menu',
        button: 'Button',
        status: 'Status',
        enabled: 'Enabled',
        disabled: 'Disabled',
        enableConfirm: 'Enable "{name}"?',
        disableConfirm: 'Disable "{name}"?',
        path: 'Route Path',
        component: 'Component',
        icon: 'Icon',
        localIcon: 'Local Icon',
        iconFontSize: 'Icon Size',
        roles: 'Route Roles',
        order: 'Order',
        sn: 'Sort No',
        keepAlive: 'Keep Alive',
        constant: 'Constant Route',
        href: 'Href',
        activeMenu: 'Active Menu',
        multiTab: 'Multi Tab',
        fixedIndexInTab: 'Fixed Index In Tab',
        query: 'Route Params',
        queryKey: 'Key',
        queryValue: 'Value',
        props: 'Route Props',
        cached: 'Keep Alive',
        hidden: 'Hidden',
        root: 'Root',
        iconPlaceholder: 'Iconify icon name, e.g. mdi:home',
        componentPlaceholder: 'e.g. layout.base or view.manage_user',
        click: 'Click Action',
        buttonPosition: 'Button Position',
        tips: {
          parent: 'Parent node; the root is -1',
          name: 'Component name, must be unique (backend `name`)',
          buttonName: 'Button display name',
          title: 'Menu title, used when no i18n key is configured',
          i18nKey: 'i18n key; when set it is used for multi-language (title is ignored)',
          permission: 'Permission code used by the backend for authorization; must be globally unique',
          icon: 'Iconify icon name, e.g. mdi:home',
          localIcon: 'Local icon name under src/assets/svg-icon; takes priority over the Iconify icon',
          iconFontSize: 'Icon font size in px',
          sn: 'Sort number among siblings; smaller comes first',
          path: 'Route path, must start with /',
          component: 'Component path, e.g. layout.base or view.manage_user',
          roles: 'Users with any of these roles can access; empty means no restriction',
          href: 'External link; opens in a new window when the menu is clicked',
          activeMenu: 'Menu key to highlight when this route is active',
          order: 'Order in the route meta',
          keepAlive: 'Whether to cache the page',
          constant: 'Constant route: no login required and defined in the front-end',
          hidden: 'Whether to hide it from the sidebar menu',
          multiTab: 'Whether the same route uses multiple tabs',
          fixedIndexInTab: 'Order when pinned in tabs',
          query: 'Query params automatically carried when entering this route',
          props: 'Props passed to the route component (JSON object)',
          click: 'Action name dispatched by the front-end on click, e.g. create / edit / delete',
          position: 'Button position: top=toolbar, row=row action; custom values allowed'
        }
      },
      dict: {
        code: 'Dict Code',
        name: 'Dict Name',
        stateLabel: 'Status',
        remark: 'Remark',
        whetherAuth: 'Requires Auth',
        enabled: 'Enabled',
        disabled: 'Disabled',
        enableConfirm: 'Enable dictionary "{name}"?',
        disableConfirm: 'Disable dictionary "{name}"?',
        entry: {
          title: 'Dictionary Entries',
          code: 'Entry Code',
          val: 'Value',
          val2: 'Value 2',
          val3: 'Value 3',
          val4: 'Value 4',
          sn: 'Sort No',
          remark: 'Remark'
        },
        allDict: 'All Dictionaries',
        ownedDict: 'Owned Dictionaries',
        selectUser: 'Select a user on the left',
        selectDict: 'Select a dictionary on the left'
      }
    },
    home: {
      branchDesc:
        'For the convenience of everyone in developing and updating the merge, we have streamlined the code of the main branch, only retaining the homepage menu, and the rest of the content has been moved to the example branch for maintenance. The preview address displays the content of the example branch.',
      greeting: 'Good morning, {username}, today is another day full of vitality!',
      weatherDesc: 'Today is cloudy to clear, 20℃ - 25℃!',
      projectCount: 'Project Count',
      todo: 'Todo',
      message: 'Message',
      downloadCount: 'Download Count',
      registerCount: 'Register Count',
      schedule: 'Work and rest Schedule',
      study: 'Study',
      work: 'Work',
      rest: 'Rest',
      entertainment: 'Entertainment',
      visitCount: 'Visit Count',
      turnover: 'Turnover',
      dealCount: 'Deal Count',
      projectNews: {
        title: 'Project News',
        moreNews: 'More News',
        desc1: 'Soybean created the open source project soybean-admin on May 28, 2021!',
        desc2: 'Yanbowe submitted a bug to soybean-admin, the multi-tab bar will not adapt.',
        desc3: 'Soybean is ready to do sufficient preparation for the release of soybean-admin!',
        desc4: 'Soybean is busy writing project documentation for soybean-admin!',
        desc5: 'Soybean just wrote some of the workbench pages casually, and it was enough to see!'
      },
      creativity: 'Creativity'
    }
  },
  form: {
    required: 'Cannot be empty',
    username: {
      required: 'Please enter user name',
      invalid: 'User name format is incorrect'
    },
    phone: {
      required: 'Please enter phone number',
      invalid: 'Phone number format is incorrect'
    },
    pwd: {
      required: 'Please enter password',
      invalid: '6-18 characters, including letters, numbers, and underscores'
    },
    confirmPwd: {
      required: 'Please enter password again',
      invalid: 'The two passwords are inconsistent'
    },
    code: {
      required: 'Please enter verification code',
      invalid: 'Verification code format is incorrect'
    },
    email: {
      required: 'Please enter email',
      invalid: 'Email format is incorrect'
    }
  },
  dropdown: {
    closeCurrent: 'Close Current',
    closeOther: 'Close Other',
    closeLeft: 'Close Left',
    closeRight: 'Close Right',
    closeAll: 'Close All',
    pin: 'Pin Tab',
    unpin: 'Unpin Tab'
  },
  icon: {
    themeConfig: 'Theme Configuration',
    themeSchema: 'Theme Schema',
    lang: 'Switch Language',
    fullscreen: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    reload: 'Reload Page',
    collapse: 'Collapse Menu',
    expand: 'Expand Menu',
    pin: 'Pin',
    unpin: 'Unpin'
  },
  datatable: {
    itemCount: 'Total {total} items',
    fixed: {
      left: 'Left Fixed',
      right: 'Right Fixed',
      unFixed: 'Unfixed'
    }
  },
  queryFilter: {
    add: 'Add condition',
    keyword: 'Keyword',
    showMore: 'Expand',
    showLess: 'Collapse',
    empty: 'No conditions yet, click "Add condition" to start',
    sort: 'Sort',
    sortTip: 'Applied in order, the first rule has the higher priority',
    addSort: 'Add sort',
    sortField: 'Sort field',
    asc: 'Ascending',
    desc: 'Descending',
    shortcut: {
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      last30Days: 'Last 30 Days',
      recentYear: 'Last 12 Months'
    },
    operator: {
      eq: 'Equals',
      ne: 'Not equal',
      like: 'Contains',
      notLike: 'Not contains',
      gt: 'Greater than',
      ge: 'Not less than',
      lt: 'Less than',
      le: 'Not greater than',
      between: 'Between',
      in: 'In',
      notIn: 'Not in'
    }
  }
};

export default local;
