<script setup lang="ts">
import { computed, h } from 'vue';
import { NTag } from 'naive-ui';
import { $t } from '@/locales';
import { formatMsgContent } from '@/utils/msg';
import ManageList from '@/components/advanced/manage-list.vue';
import type { QueryField } from '@/components/advanced/query-filter/types';
import type { ManageColumn } from '@/utils/table';

defineOptions({
  name: 'ManageMsg'
});

/**
 * The search SQL joins the message content as `c` (`system_msg_content c`), so a condition on the
 * content has to name that alias; a condition without alias only reaches the main table.
 */
const CONTENT_ALIAS = 'c';

/** Search fields of the query filter */
const searchFields = computed<QueryField[]>(() => [
  {
    prop: 'createTime',
    label: $t('page.manage.msg.createTime'),
    valueType: 'date',
    types: ['between', 'ge', 'le', 'eq']
  },
  {
    prop: 'haveRead',
    label: $t('page.manage.msg.haveRead'),
    valueType: 'select',
    types: ['eq'],
    // the message Qo takes the read flag as a top-level param, not as a `items` condition
    param: true,
    options: [
      { label: $t('page.manage.msg.unread'), value: 'false' },
      { label: $t('page.manage.msg.read'), value: 'true' }
    ],
    // unread messages first, that is what the message center is for
    defaultValues: ['false']
  },
  {
    prop: 'content',
    label: $t('page.manage.msg.content'),
    alias: CONTENT_ALIAS,
    valueType: 'text',
    types: ['like']
  }
]);

/** Data columns; the messages are already scoped to the current user by the backend */
const columns = computed<ManageColumn<Api.SystemManage.SystemMsg>[]>(() => [
  {
    key: 'type',
    title: $t('page.manage.msg.type'),
    align: 'center',
    width: 140,
    render: row => {
      const type = row.typeVal || row.type;

      return type ? h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => type }) : '';
    }
  },
  {
    key: 'content',
    title: $t('page.manage.msg.content'),
    minWidth: 360,
    ellipsis: { tooltip: true },
    render: row => formatMsgContent(row.content)
  },
  {
    key: 'haveRead',
    title: $t('page.manage.msg.haveRead'),
    align: 'center',
    width: 110,
    render: row =>
      h(
        NTag,
        { size: 'small', bordered: false, type: row.haveRead ? 'default' : 'warning' },
        { default: () => $t(row.haveRead ? 'page.manage.msg.read' : 'page.manage.msg.unread') }
      )
  },
  { key: 'createTime', title: $t('page.manage.msg.createTime'), align: 'center', minWidth: 170 }
]);

/** the list takes the columns as a factory, they follow the locale */
function getColumns() {
  return columns.value;
}
</script>

<template>
  <div class="min-h-0 flex flex-1 overflow-hidden">
    <ManageList
      table-key="manage_msg"
      class="min-h-0 flex-1"
      url="/system/msg/search"
      :fields="searchFields"
      :columns="getColumns"
    />
  </div>
</template>
