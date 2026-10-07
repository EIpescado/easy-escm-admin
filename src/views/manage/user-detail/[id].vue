<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchRoleSelect, fetchUserDetail } from '@/service/api';
import { $t, getLocale } from '@/locales';

defineOptions({
  name: 'ManageUserDetail'
});

interface Props {
  /** user id from the route param `/manage/user-detail/:id` */
  id: string;
}

const props = defineProps<Props>();

const router = useRouter();

const loading = ref(false);

const detail = ref<Api.SystemManage.UserForm | null>(null);

/** localized role names resolved from the user's roleIds */
const roleNames = ref<string[]>([]);

/** role names joined with a locale-aware separator */
const roleText = computed(() => roleNames.value.join(getLocale() === 'zh-CN' ? '、' : ', '));

/** Back to the user list */
function goBack() {
  router.push({ name: 'manage_user' });
}

onMounted(async () => {
  loading.value = true;

  const [{ data: user }, { data: roles }] = await Promise.all([fetchUserDetail(props.id), fetchRoleSelect()]);

  detail.value = user ?? null;

  const roleMap = new Map((roles ?? []).map(role => [String(role.id), role.roleName]));
  roleNames.value = (user?.roleIds ?? []).map(id => roleMap.get(String(id)) ?? String(id));

  loading.value = false;
});
</script>

<template>
  <div class="min-h-0 flex flex-1 flex-col gap-16px overflow-hidden">
    <NCard :bordered="false" size="small" class="card-wrapper">
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ $t('route.manage_user-detail') }}</span>
          <NButton size="small" @click="goBack">
            <template #icon>
              <icon-mdi-arrow-left class="text-icon" />
            </template>
            {{ $t('common.back') }}
          </NButton>
        </div>
      </template>
      <NSpin :show="loading">
        <NDescriptions v-if="detail" :column="2" label-placement="left" bordered>
          <NDescriptionsItem :label="$t('page.manage.user.username')">{{ detail.username }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.manage.user.nickname')">{{ detail.nickname }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.manage.user.phone')">{{ detail.phone || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.manage.user.mail')">{{ detail.mail || '-' }}</NDescriptionsItem>
          <NDescriptionsItem :label="$t('page.manage.user.role')" :span="2">
            {{ roleText || '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped></style>
