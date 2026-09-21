import { transformRecordToOption } from '@/utils/common';

/** user state record */
export const userStateRecord: Record<string, App.I18n.I18nKey> = {
  NORMAL: 'page.manage.user.state.normal',
  FORBIDDEN: 'page.manage.user.state.forbidden',
  NOT_ACTIVATED: 'page.manage.user.state.notActivated'
};

export const userStateOptions = transformRecordToOption(userStateRecord);

/** role state record */
export const roleStateRecord: Record<string, App.I18n.I18nKey> = {
  ON: 'page.manage.role.state.on',
  OFF: 'page.manage.role.state.off'
};

export const roleStateOptions = transformRecordToOption(roleStateRecord);
