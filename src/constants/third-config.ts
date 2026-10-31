/** one field of a channel / template config form */
export interface ConfigField {
  /** property name in the backend config JSON */
  key: string;
  /** short i18n label; a label that does not fit the label column keeps its detail in {@link tip} */
  label: App.I18n.I18nKey;
  /** field explanation, shown by the `?` of `FormLabel` */
  tip?: App.I18n.I18nKey;
  /** input type, defaults to text */
  type?: 'text' | 'password' | 'number';
  /** credential, masked when the config is shown in a list */
  sensitive?: boolean;
}

/**
 * Config fields of each third-party channel type
 *
 * Mirrors the backend prop classes the `config` JSON is parsed into:
 * `MailProp` / `WxCpProp` / `WxMpProp` / `WxWebhookProp`.
 */
export const CHANNEL_CONFIG_FIELDS: Record<string, ConfigField[]> = {
  MAIL: [
    { key: 'host', label: 'page.manage.third.fieldHost' },
    { key: 'port', label: 'page.manage.third.fieldPort', type: 'number' },
    { key: 'username', label: 'page.manage.third.fieldUsername' },
    { key: 'password', label: 'page.manage.third.fieldPassword', type: 'password', sensitive: true },
    { key: 'alias', label: 'page.manage.third.fieldAlias' }
  ],
  WX_CP: [
    { key: 'corpId', label: 'page.manage.third.fieldCorpId', tip: 'page.manage.third.fieldCorpIdTip' },
    {
      key: 'agentId',
      label: 'page.manage.third.fieldAgentId',
      tip: 'page.manage.third.fieldAgentIdTip',
      type: 'number'
    },
    {
      key: 'secret',
      label: 'page.manage.third.fieldSecret',
      tip: 'page.manage.third.fieldSecretTip',
      type: 'password',
      sensitive: true
    },
    { key: 'token', label: 'page.manage.third.fieldToken', sensitive: true },
    { key: 'aesKey', label: 'page.manage.third.fieldAesKey', tip: 'page.manage.third.fieldAesKeyTip', sensitive: true }
  ],
  WX_WEBHOOK: [
    { key: 'corpId', label: 'page.manage.third.fieldCorpId', tip: 'page.manage.third.fieldCorpIdTip' },
    {
      key: 'agentId',
      label: 'page.manage.third.fieldAgentId',
      tip: 'page.manage.third.fieldAgentIdTip',
      type: 'number'
    },
    {
      key: 'webhookKey',
      label: 'page.manage.third.fieldWebhookKey',
      tip: 'page.manage.third.fieldWebhookKeyTip',
      sensitive: true
    }
  ],
  // 微信公众号: the token / aes key only matter when the account receives messages
  WX_MP: [
    { key: 'appId', label: 'page.manage.third.fieldAppId', tip: 'page.manage.third.fieldAppIdTip' },
    {
      key: 'secret',
      label: 'page.manage.third.fieldSecret',
      tip: 'page.manage.third.fieldMpSecretTip',
      type: 'password',
      sensitive: true
    },
    { key: 'token', label: 'page.manage.third.fieldToken', tip: 'page.manage.third.fieldMpTokenTip', sensitive: true },
    {
      key: 'aesKey',
      label: 'page.manage.third.fieldAesKey',
      tip: 'page.manage.third.fieldMpAesKeyTip',
      sensitive: true
    }
  ]
};

/**
 * Template config fields of each channel type
 *
 * Mirrors the backend config class read by the channel: mail uses
 * `SystemThirdMsgTemplate.MailMapping` (`subject` / `ftl`); the WeCom channels read no template config.
 */
export const TEMPLATE_CONFIG_FIELDS: Record<string, ConfigField[]> = {
  MAIL: [
    { key: 'subject', label: 'page.manage.thirdTemplate.fieldSubject' },
    { key: 'ftl', label: 'page.manage.thirdTemplate.fieldFtl', tip: 'page.manage.thirdTemplate.fieldFtlTip' }
  ]
};
