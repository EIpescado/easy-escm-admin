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
 * The Official Account ({@link WX_MP_TYPE}) has a dedicated editor, see {@link MpTemplateConfig}.
 */
export const TEMPLATE_CONFIG_FIELDS: Record<string, ConfigField[]> = {
  MAIL: [
    { key: 'subject', label: 'page.manage.thirdTemplate.fieldSubject' },
    { key: 'ftl', label: 'page.manage.thirdTemplate.fieldFtl', tip: 'page.manage.thirdTemplate.fieldFtlTip' }
  ]
};

/** channel type of a WeChat Official Account */
export const WX_MP_TYPE = 'WX_MP';

/**
 * Template config of an Official Account channel
 *
 * The account template is picked from WeChat (`getAllPrivateTemplate`), then every message parameter
 * is mapped onto one of its keys: `subTitle` → `first`, the template entries → `keyword1..n`,
 * `remark` → `remark`.
 */
export interface MpTemplateConfig {
  /** WeChat template message id */
  templateId: string;
  /** WeChat template title, kept so the list can show it without asking WeChat */
  title?: string;
  /** message parameter name (`subTitle` / entry prop / `remark`) → WeChat template key */
  mapping: Record<string, string>;
}

/** parse a stored {@link MpTemplateConfig}, `null` when the JSON is empty or has no template id */
export function parseMpTemplateConfig(raw: string | null | undefined): MpTemplateConfig | null {
  if (!raw?.trim()) return null;

  let parsed: Partial<MpTemplateConfig>;

  try {
    parsed = JSON.parse(raw) as Partial<MpTemplateConfig>;
  } catch {
    return null;
  }

  if (!parsed?.templateId) return null;

  const mapping: Record<string, string> = {};

  Object.entries(parsed.mapping ?? {}).forEach(([key, value]) => {
    if (value) mapping[key] = String(value);
  });

  return {
    templateId: String(parsed.templateId),
    title: parsed.title ? String(parsed.title) : undefined,
    mapping
  };
}

/** keys of a WeChat template content, in the order they appear, e.g. `['first', 'keyword1', 'remark']` */
export function parseMpTemplateKeys(content: string | null | undefined): string[] {
  const keys: string[] = [];
  const pattern = /\{\{\s*([A-Za-z0-9_]+)\.DATA\s*\}\}/g;

  let match = pattern.exec(content ?? '');

  while (match) {
    if (!keys.includes(match[1])) keys.push(match[1]);

    match = pattern.exec(content ?? '');
  }

  return keys;
}
