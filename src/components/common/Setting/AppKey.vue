<script lang="ts" setup>
import { ref } from "vue";
import { NButton, NPopconfirm, useMessage, NTag } from "naive-ui";
import { useBasicLayout } from "@/hooks/useBasicLayout";
// import { t } from "@/locales";
import apiAuth from "@/api/apiAuth";

const { isMobile } = useBasicLayout();

const ms = useMessage();

const appKey = ref<any>();
const loading = ref(false);

const queryAppKey = async () => {
  const res = await apiAuth.queryAppKey();
  appKey.value = res.data;
};

const getAppKey = async () => {
  loading.value = true;
  const res = await apiAuth.getAppKey();
  if (res.code == 200) {
    appKey.value = res.data;
  } else {
    ms.warning(res.message);
  }
  loading.value = false;
};

const refreshAppKey = async () => {
  loading.value = true;
  const res = await apiAuth.refreshAppKey();
  if (res.code == 200) {
    appKey.value = res.data;
  } else {
    ms.warning(res.message);
  }
  loading.value = false;
};

const deleteAppkey = async () => {
  const res = await apiAuth.deleteAppKey();
  if (res.code == 200) {
    ms.success(res.message);
    appKey.value = undefined;
  } else {
    ms.warning(res.message);
  }
};

queryAppKey();
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div
        class="flex items-center space-x-4"
        :class="isMobile && 'items-start'"
      >
        <p>{{ $t("setting.appKey") }}：{{ appKey?.token ?? "-" }}</p>
        <div v-show="appKey">
          <NTag
            v-if="appKey?.status === 'VALID'"
            :bordered="false"
            type="success"
            size="small"
            >有效期至：{{ appKey?.expired }}</NTag
          >
          <NTag v-else :bordered="false" type="error" size="small">已过期</NTag>
        </div>
      </div>
      <div
        class="flex items-center justify-end space-x-4"
        :class="isMobile && 'items-start'"
      >
        <div class="flex flex-wrap items-center justify-end gap-2">
          <NButton
            size="small"
            @click="getAppKey"
            v-show="!appKey"
            :loading="loading"
          >
            {{ $t("common.get") }}
          </NButton>
          <NButton
            size="small"
            @click="refreshAppKey"
            v-show="appKey"
            :loading="loading"
          >
            {{ $t("common.refresh") }}
          </NButton>
          <NPopconfirm placement="bottom" @positive-click="deleteAppkey">
            <template #trigger>
              <NButton size="small" v-show="appKey">
                {{ $t("common.delete") }}
              </NButton>
            </template>
            {{ $t("common.deleteConfirm") }}
          </NPopconfirm>
        </div>
      </div>
    </div>
  </div>
</template>
