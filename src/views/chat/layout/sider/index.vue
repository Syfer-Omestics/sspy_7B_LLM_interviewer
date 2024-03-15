<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref, watch } from "vue";
import { marked } from "marked";
import mammoth from "mammoth";
import { useRoute } from "vue-router";
import {
  NButton,
  NLayoutSider,
  NModal,
  NSelect,
  NSpace,
  useMessage,
  NRadioGroup,
  NRadio,
} from "naive-ui";
import List from "./List.vue";
import Footer from "./Footer.vue";
import ChapterList from "./ChapterList.vue";
import { HoverButton, SvgIcon } from "@/components/common";
import { useAppStore, useChatStore } from "@/store";
import { useBasicLayout } from "@/hooks/useBasicLayout";
import { PromptStore } from "@/components/common";
import apiRobot from "@/api/apiRobot";

const appStore = useAppStore();
const chatStore = useChatStore();
const message = useMessage();
const { isMobile } = useBasicLayout();
const route = useRoute();
const { uuid } = route.params as { uuid: string };
const show = ref(false);
const showModal = ref(false);
const newChatType = ref(0);
const resumeType = ref(0);
const options: any = ref([]);
const instanceId = ref();
const collapsed = computed(() => appStore.siderCollapsed);
const loading = ref(false);

const instanceInfo = computed(
  () => chatStore.getChatHistoryByCurrentActive?.instanceInfo
);

const chapters: any = ref([]);

const showChapterList = ref(true);

const fileInfo: any = ref({});

async function handleAdd(id: any, resumeType: any) {
	loading.value = true;
	const  instanceInfo  = {
		"id": id,
		"instanceName": resumeType?"简历智能问答机器人":"智能简历面试官",
		"instanceDesc": "LangChain简历机器人",
		"instanceType": "Mission",
		"instanceStatus": "ONLINE",
		"domainClassifyModelId": null,
		"rowKeys": null,
		"relatedChapterInstance": "205",
		"usingLLM": true,
		"strategyType": "SINGLE_DOMAIN",
		"createTime": "2024-01-03 18:07:57",
		"updateTime": "2024-01-29 13:24:53",
		"token": ""
	}
	const res = await apiRobot.getTokenWithChatBotInstanceId({
		instanceId: id,
	});

	instanceInfo.token = res.data;
	chatStore.addHistory({
		title: instanceInfo.instanceName,
		uuid: Date.now(),
		isEdit: false,
		instanceInfo,
		resumeType:resumeType
	});
	loading.value = false;
if (isMobile.value) appStore.setSiderCollapsed(true);
showModal.value = false;
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value);
}

// const findPageChatBotChapterCorpusDocs = async () => {
//   // loading.value = true;
//   const res = await apiRobot.findPageChatBotChapterCorpusDocs({
//     currentPage: 0,
//     pageSize: 100,
//     instanceId: instanceInfo.value.id,
//     // isRegistered: "IS_REGISTERED",
//   });
//   res.data ? (chapters.value = res.data.content): chapters.value = [];
//   // loading.value = false;
// };

// findPageChatBotChapterCorpusDocs();

const getPageableChatBotInstance = async () => {
  const res = await apiRobot.getPageableChatBotInstance({
    currentPage: 0,
    pageSize: 100,
  });

  options.value = res.data.content
    .filter((d: { instanceStatus: string }) => d.instanceStatus === "ONLINE")
    .map((d: any) => ({
      label: d.instanceName,
      value: d.id,
      instanceInfo: d,
    }));
};
// getPageableChatBotInstance();

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: "fixed",
      zIndex: 50,
    };
  }
  return {};
});

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: "env(safe-area-inset-bottom)",
    };
  }
  return {};
});

const afterClose = () => {
  newChatType.value = 0;
  instanceId.value = undefined;
};

const handleOk = (file: any) => {
  const fileType = file.type;
  if (fileType === "text/plain") {
    readTxt(file);
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    readDoc(file);
  } else if (fileType === "application/pdf") {
    readPdf(file);
  } else if (fileType === "application/octet-stream") {
    readMd(file);
  } else {
    message.warning("无法预览该文件");
    return;
  }
};

const readMd = (file: any) => {
  const reader: any = new FileReader();
  reader.onload = () => {
    fileInfo.value = { fileType: "md", filePath: marked(reader.result) };
  };
  reader.readAsText(file, "utf-8");
};

const readTxt = (file: any) => {
  window.URL = window.URL || window.webkitURL;
  fileInfo.value = {
    fileType: "txt",
    filePath: window.URL.createObjectURL(file),
  };
};

const readDoc = (file: any) => {
  const reader = new FileReader();
  reader.onload = function (loadEvent: Event) {
    const arrayBuffer: any = reader.result;
    console.log(
      "🚀 ~ file: chapters-import.tsx:123 ~ readDoc ~ arrayBuffer:",
      arrayBuffer
    );
    mammoth.convertToHtml({ arrayBuffer }).then((res: any) => {
      fileInfo.value = { fileType: "docx", filePath: res.value };
      console.log(fileInfo.value);
    });
  };
  reader.readAsArrayBuffer(file);
};

const readPdf = (file: any) => {
  window.URL = window.URL || window.webkitURL;
  fileInfo.value = {
    fileType: "pdf",
    filePath: window.URL.createObjectURL(file),
  };
};

function getFileFromUrl(url: string, fileName: string) {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(url);
    const blob = await response.blob();
    let file = new File([blob!], fileName, { type: blob.type });
    resolve(file);
  });
}

async function handlePreview(file: any) {
	console.log(file.name)
	handleOk(file);
}

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val);
  },
  {
    immediate: true,
    flush: "post",
  }
);
// watch(
//   instanceInfo,
//   (val) => {
//     findPageChatBotChapterCorpusDocs();
//   },
//   {
//     immediate: true,
//     flush: "post",
//   }
// );
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="showChapterList ? 520 : 260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    position="absolute"
    bordered
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div
      v-show="!fileInfo.filePath"
      class="flex flex-col h-full"
      :style="mobileSafeArea"
    >
      <div class="flex flex-1 min-h-0">
        <main class="flex flex-col flex-1 min-h-0 w-1/2">
          <div class="p-4">
            <NButton
              dashed
              block
              @click="
                showModal = true;
                // handleAdd(180)
              "
            >
              新建简历问答对话~
            </NButton>
          </div>
          <div class="flex-1 min-h-0 pb-4 overflow-hidden flex">
            <List />
          </div>
          <!-- <div class="p-4">
						<NButton block @click="show = true">
							{{ $t("store.siderButton") }}
						</NButton>
					</div> -->
        </main>
        <div class="w-1/2" v-if="showChapterList">
          <ChapterList
            @handle-preview="handlePreview"
            :key="chatStore.active ?? 0"
          />
        </div>
      </div>
      <Footer />
    </div>
    <div v-show="fileInfo.filePath" class="flex flex-col h-full">
      <div class="flex justify-end">
        <HoverButton @click="fileInfo = {}">
          <span class="text-xl text-[#4f555e] dark:text-white">
            <SvgIcon icon="material-symbols:close-rounded" />
          </span>
        </HoverButton>
      </div>
      <div
        class="grow w-full"
        style="
          /* width: 800px; */
          /* height: 700px; */
          /* height: 100%; */
          overflow: auto;
          padding: 10px;
          border: 1px solid #ccc;
        "
      >
        <iframe
          v-if="fileInfo.fileType === 'txt' || fileInfo.fileType === 'pdf'"
          :src="fileInfo.filePath"
          class="w-full h-full"
        ></iframe>
        <div v-else v-html="fileInfo.filePath" class="markdown-body"></div>
      </div>
    </div>
  </NLayoutSider>
  <NModal
    v-model:show="showModal"
    title="选择简历问答模式"
    preset="card"
    style="width: 600px; top: -200px"
    :on-after-leave="afterClose"
  >
    <NRadioGroup
      class="mb-6 mt-2"
      v-model:value="resumeType"
      name="radiogroup"
    >
      <NSpace>
        <NRadio :value="0">模拟面试官</NRadio>
        <NRadio :value="1">简历内容智能问答</NRadio>
      </NSpace>
    </NRadioGroup>
<!--    <NSelect-->
<!--      v-model:value="instanceId"-->
<!--      :options="options"-->
<!--      v-show="newChatType === 1"-->
<!--    />-->
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showModal = false">{{ $t("common.cancel") }}</NButton>
        <NButton
          :loading="loading"
          class="ml-4"
          type="primary"
          @click="handleAdd(345,resumeType)"
          >{{ $t("common.confirm") }}</NButton
        >
      </NSpace>
    </template>
  </NModal>
  <template v-if="isMobile">
    <div
      v-show="!collapsed"
      class="fixed inset-0 z-40 w-full h-full bg-black/40"
      @click="handleUpdateCollapsed"
    />
  </template>
  <PromptStore v-model:visible="show" />
</template>
