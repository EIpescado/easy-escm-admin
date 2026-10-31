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
    dict: {
      addUserDict: 'Add User Dictionary',
      removeUserDict: 'Remove User Dictionary',
      bindUserAllDict: 'Bind All Dictionaries',
      removeUserAllDict: 'Unbind All Dictionaries'
    },
    menu: {
      createSubMenu: 'Create Submenu',
      createTopMenu: 'Create Top Menu',
      edit: 'Edit Menu'
    },
    button: {
      create: 'Create Button',
      copy: 'Copy Button',
      edit: 'Edit Button'
    },
    file: {
      upload: 'Upload',
      download: 'Download'
    },
    callback: {
      reExecute: 'Re-execute'
    },
    specialFile: {
      download: 'Download'
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
    loading: 'Loading…',
    copy: 'Copy',
    copySuccess: 'Copied',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
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
    message: 'Messages',
    file: 'File Management',
    api: 'API Management',
    manage_user: 'User',
    manage_role: 'Role',
    manage_menu: 'Menu',
    manage_dict: 'Dictionary',
    manage_file: 'File',
    manage_callback: 'Callback',
    manage_client: 'Client',
    manage_no: 'Numbering Rule',
    manage_notice: 'Announcement',
    manage_org: 'Organization',
    'manage_special-file': 'Special File',
    manage_third: 'Third-party Systems',
    'manage_third-template': 'Third Party Template',
    'manage_msg-template': 'Message Template',
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
        fixedIndexInTab: 'Fixed Tab',
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
        boundAllDict: 'All dictionaries bound',
        ownedDict: 'Owned Dictionaries',
        selectUser: 'Select a user on the left',
        selectDict: 'Select a dictionary on the left',
        searchDict: 'Type a dictionary code or name',
        checkDict: 'Check the dictionaries to remove first'
      },
      file: {
        id: 'File ID',
        fileName: 'File Name',
        fileType: 'File Type',
        fileSize: 'File Size',
        fileTag: 'File Tag',
        storeMode: 'Store Mode',
        bucket: 'Bucket',
        filePath: 'File Path',
        creator: 'Uploader',
        createTime: 'Upload Time',
        uploadTitle: 'Upload File',
        file: 'File',
        selectFile: 'Select File',
        selectFileTag: 'Please select a file tag',
        selectFileRequired: 'Please select a file to upload',
        uploadSuccess: 'Upload Success',
        uploadTip:
          'Files up to {size} are uploaded directly, larger ones are uploaded in chunks (instant upload & resume supported)',
        downloadFailed: 'Download failed',
        previewFailed: 'Preview failed',
        previewUnsupported: 'This file type cannot be previewed',
        previewTooLarge: 'The file is too large to preview',
        previewDownload: 'Download File',
        phase: {
          hashing: 'Computing file fingerprint…',
          checking: 'Checking the file…',
          uploading: 'Uploading chunks {percent}%',
          merging: 'Merging chunks…'
        }
      },
      callback: {
        id: 'Callback ID',
        type: 'Callback Type',
        name: 'Callback Name',
        success: 'Result',
        successYes: 'Success',
        successNo: 'Failed',
        subject: 'Subject',
        primaryKey: 'Business Key',
        traceId: 'Trace ID',
        creator: 'Triggered By',
        requestTime: 'Request Time',
        requestContent: 'Request',
        responseContent: 'Response',
        showRequestContent: 'Show Request',
        showResponseContent: 'Show Response',
        reExecuteConfirm: 'Re-execute the {count} selected callback(s)?',
        reExecuteSuccess: 'Re-execution triggered',
        view: 'View',
        viewRequest: 'Request Payload',
        viewResponse: 'Response Payload',
        noContent: 'No content'
      },
      client: {
        clientId: 'Client ID',
        clientSecret: 'Client Secret',
        grantType: 'Grant Types',
        deviceType: 'Device Type',
        activeTimeout: 'Active TTL',
        timeout: 'Token TTL',
        state: 'State',
        remark: 'Remark',
        createTime: 'Created At',
        unlimited: 'Unlimited',
        activeTimeoutTip: 'In seconds; -1 means unlimited',
        timeoutTip: 'In seconds; -1 means unlimited',
        grantTypePlaceholder: 'Select grant types',
        enableConfirm: 'Enable the client {name}?',
        disableConfirm: 'Disable the client {name}?',
        createTitle: 'Create Client',
        editTitle: 'Edit Client'
      },
      msgTemplate: {
        code: 'Code',
        type: 'Type',
        typePlaceholder: 'Select a message type',
        sn: 'Sort',
        title: 'Title',
        titleDesc: 'Title Description',
        subTitle: 'Sub Title',
        subTitleDesc: 'Sub Note',
        subTitleDescTip: 'Note text shown under the sub title',
        whetherConfirm: 'Require Confirmation',
        hidden: 'Hidden in Config',
        remark: 'Remark',
        remarkDesc: 'Note',
        remarkDescTip: 'Note text shown under the remark',
        state: 'State',
        createTime: 'Created At',
        entries: 'Template Entries',
        entrySn: 'Sort',
        entryType: 'Entry Type',
        entryTypePlaceholder: 'Select an entry type',
        entryLabel: 'Label',
        entryLabelDesc: 'Label Description',
        entryVal: 'Default Value',
        entryProp: 'Field Name',
        entryColor: 'Color',
        enableConfirm: 'Enable the template {name}?',
        disableConfirm: 'Disable the template {name}?',
        createTitle: 'Create Message Template',
        editTitle: 'Edit Message Template'
      },
      no: {
        docType: 'Document Type',
        docTypeTip: 'Unique key of the rule, the backend fetches numbers by it, e.g. ORDER / PICK',
        docTypePlaceholder: 'e.g. ORDER',
        prefix: 'Prefix',
        format: 'Time Format',
        formatTip: 'Java DateTimeFormatter pattern; leave empty to build numbers without time',
        formatPlaceholder: 'e.g. yyMMdd',
        template: 'Number Template',
        templateTip:
          'Placeholders prefix / time / seq: the number prefix, the time formatted by the pattern, the zero padded sequence; leave empty to use prefix + time + sequence',
        currentNo: 'Current No',
        currentNoTip: 'Numbers continue from this value; the backend resets it when the time cycle changes',
        bit: 'Digits',
        bitTip: 'Pads the sequence with leading zeros to this length',
        batchNumber: 'Batch Size',
        batchNumberTip: 'Numbers pre-generated into Redis per fetch, default 10',
        lastFetchTime: 'Last Fetched At',
        remark: 'Description',
        createTime: 'Created At',
        createTitle: 'Create Numbering Rule',
        editTitle: 'Edit Numbering Rule'
      },
      notice: {
        type: 'Type',
        typePlaceholder: 'Select a notice type',
        title: 'Title',
        content: 'Content',
        onTime: 'Effective At',
        publishTime: 'Published At',
        offTime: 'Expires At',
        targets: 'Visibility',
        targetsTip:
          'Leave empty to show the notice to every org / role / level; use an org code or a role code as the code',
        targetType: 'Target Type',
        targetCode: 'Target Code',
        creator: 'Publisher',
        createTime: 'Created At',
        createTitle: 'Create Announcement',
        editTitle: 'Edit Announcement'
      },
      org: {
        code: 'Org Code',
        codeTip: 'The org code identifies the tenant and the current org, change it with care',
        codePlaceholder: 'e.g. HFY',
        name: 'Org Name',
        state: 'State',
        remark: 'Remark',
        creator: 'Created By',
        createTime: 'Created At',
        enableConfirm: 'Enable the organization {name}?',
        disableConfirm: 'Disable the organization {name}?',
        createTitle: 'Create Organization',
        editTitle: 'Edit Organization'
      },
      specialFile: {
        code: 'Code',
        codeTip: 'Business code used to fetch the file, e.g. an import template code',
        codePlaceholder: 'e.g. IMPORT_ORDER',
        file: 'File',
        filePlaceholder: 'Upload a file',
        uploadFile: 'Upload',
        clearFile: 'Clear',
        fileName: 'File Name',
        userName: 'User',
        userId: 'User',
        userTip: 'Leave empty to apply to every user',
        all: 'All',
        state: 'State',
        remark: 'Remark',
        createTime: 'Created At',
        enableConfirm: 'Enable the special file {name}?',
        disableConfirm: 'Disable the special file {name}?',
        createTitle: 'Create Special File',
        editTitle: 'Edit Special File'
      },
      third: {
        type: 'Type',
        typePlaceholder: 'Select a type',
        name: 'Name',
        nameTip: 'A type can have several configs, e.g. two different mail senders',
        namePlaceholder: 'e.g. Mail - Default',
        config: 'Config',
        configTip: 'Fields depend on the selected type, saved as the JSON the backend expects',
        configPendingTip: 'Select a type first',
        configUnknownTip: 'No form for this type yet, fill the JSON directly',
        fieldHost: 'Mail Server',
        fieldPort: 'Port',
        fieldUsername: 'Mail Account',
        fieldPassword: 'Mail Password',
        fieldAlias: 'Sender Alias',
        fieldCorpId: 'Corp ID',
        fieldCorpIdTip: 'corpId, the enterprise ID in the WeCom admin console',
        fieldAgentId: 'Agent ID',
        fieldAgentIdTip: 'agentId, the AgentId shown in the WeCom app details',
        fieldSecret: 'App Secret',
        fieldSecretTip: 'secret, the Secret of the WeCom app',
        fieldToken: 'Token',
        fieldAesKey: 'AESKey',
        fieldAesKeyTip: 'EncodingAESKey of the WeCom message receiving settings',
        fieldWebhookKey: 'Webhook',
        fieldWebhookKeyTip: 'webhookKey, the key parameter of the WeCom bot webhook URL',
        fieldAppId: 'App ID',
        fieldAppIdTip:
          'appId, found in the Official Account console under Settings & Development → Basic configuration',
        fieldMpSecretTip: 'secret, the AppSecret (developer password) of the Official Account',
        fieldMpTokenTip: 'Token of the Official Account message server settings; leave empty when it only pushes',
        fieldMpAesKeyTip: 'EncodingAESKey of the message server settings, required by the safe (encrypted) mode',
        formatJson: 'Format',
        invalidJson: 'The config is not valid JSON',
        state: 'State',
        remark: 'Remark',
        createTime: 'Created At',
        enableConfirm: 'Enable the third-party system {name}?',
        disableConfirm: 'Disable the third-party system {name}?',
        createTitle: 'Create Third-party System',
        editTitle: 'Edit Third-party System'
      },
      thirdTemplate: {
        template: 'Template',
        templatePlaceholder: 'Select a message template',
        third: 'Third-party System',
        thirdPlaceholder: 'Select a third-party system',
        name: 'Name',
        namePlaceholder: 'e.g. Order Mail Template',
        nameTip: 'Used to tell the templates of the same system apart',
        config: 'Config',
        configTip: 'Fields depend on the type of the selected system',
        configPendingTip: 'Select a system first',
        noConfigTip: 'This type needs no template config',
        noConfigMpTip:
          'The Official Account template message ID is not configured here; maintain it in the wx_mp_template_mapping dictionary as AppID + template code',
        fieldSubject: 'Mail Subject',
        fieldFtl: 'File',
        fieldFtlTip: 'ftl template file name in the backend template folder, e.g. default_mail.ftlh',
        formatJson: 'Format',
        invalidJson: 'The config is not valid JSON',
        state: 'State',
        remark: 'Remark',
        createTime: 'Created At',
        enableConfirm: 'Enable the channel template {name}?',
        disableConfirm: 'Disable the channel template {name}?',
        createTitle: 'Create Channel Template',
        editTitle: 'Edit Channel Template'
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
      latestNotice: {
        title: 'Latest Notices',
        more: 'More',
        empty: 'No notices'
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
