<script setup lang="ts">
import { computed, ref } from "vue";
import { NDropdown, useMessage } from "naive-ui";
import AvatarComponent from "./Avatar.vue";
import TextComponent from "./Text.vue";
import { SvgIcon } from "@/components/common";
import { useIconRender } from "@/hooks/useIconRender";
import { t } from "@/locales";
import { useBasicLayout } from "@/hooks/useBasicLayout";
import { copyToClip } from "@/utils/copy";

interface Props {
  dateTime?: string;
  text?: any;
  duration?:number;
  playing?:boolean;
  inversion?: boolean;
  error?: boolean;
  loading?: boolean;
  type?: string;
  commentable?: boolean; // 仅回答和推荐问题可点赞点踩
  sentenceInfo?: any;
  feedback?: number;
  requestOptions: any;
  isLogMode: boolean;
  submited?:boolean;
}

interface Emit {
  (ev: "regenerate"): void;
  (ev: "delete"): void;
  (ev: "scrollToBottom"): void;
  (ev: "thumbUp"): void;
  (ev: "thumbDown"): void;
  (ev: "chatBotStrategyExecutor"): void;
  (ev: "showSentenceInfo"): void;
  (ev: "finishSubmit"): void;
  (ev: "playAudio"): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emit>();

const { isMobile } = useBasicLayout();

const { iconRender } = useIconRender();

const message = useMessage();

const textRef = ref<HTMLElement>();

const asRawText = ref(props.inversion);

const messageRef = ref<HTMLElement>();

const options = computed(() => {
  const common = [
    {
      label: t("chat.copy"),
      key: "copyText",
      icon: iconRender({ icon: "ri:file-copy-2-line" }),
    },
    {
      label: t("common.delete"),
      key: "delete",
      icon: iconRender({ icon: "ri:delete-bin-line" }),
    },
  ];
  // if (props.commentable) {
  //   if (!props.feedback) {
  //     common.unshift({
  //       label: "点踩",
  //       key: "thumbDown",
  //       icon: iconRender({
  //         icon: "material-symbols:thumb-down-outline",
  //       }),
  //     });
  //     common.unshift({
  //       label: "点赞",
  //       key: "thumbUp",
  //       icon: iconRender({ icon: "material-symbols:thumb-up-outline" }),
  //     });
  //   } else if (props.feedback === 1) {
  //     common.unshift({
  //       label: "已赞",
  //       key: "thumbUped",
  //       icon: iconRender({
  //         icon: "material-symbols:thumb-up-outline",
  //         color: "green",
  //       }),
  //     });
  //   } else if (props.feedback === 2) {
  //     common.unshift({
  //       label: "已踩",
  //       key: "thumbDowned",
  //       icon: iconRender({
  //         icon: "material-symbols:thumb-down-outline",
  //         color: "red",
  //       }),
  //     });
  //   }
  // }
  // if (!props.inversion) {
  //   common.unshift({
  //     label: asRawText.value ? t("chat.preview") : t("chat.showRawText"),
  //     key: "toggleRenderType",
  //     icon: iconRender({
  //       icon: asRawText.value ? "ic:outline-code-off" : "ic:outline-code",
  //     }),
  //   });
  // }

  return common;
});

function handleSelect(
  key: "copyText" | "delete" | "toggleRenderType" | "thumbUp" | "thumbDown"
) {
  switch (key) {
    case "thumbUp":
      emit("thumbUp");
      return;
    case "thumbDown":
      emit("thumbDown");
      return;
    case "copyText":
      handleCopy();
      return;
    case "toggleRenderType":
      asRawText.value = !asRawText.value;
      return;
    case "delete":
      emit("delete");
  }
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView();
  emit("regenerate");
}

function scrollToBottom() {
  emit("scrollToBottom");
}

function chatBotStrategyExecutor() {
  emit("chatBotStrategyExecutor");
}

async function handleCopy() {
  try {
    await copyToClip(props.text || "");
    message.success("复制成功");
  } catch {
    message.error("复制失败");
  }
}
</script>

<template>
  <div
    ref="messageRef"
    class="flex w-full mb-6 overflow-hidden"
    :class="[{ 'flex-row-reverse': inversion }]"
  >
    <div
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :image="inversion" />
    </div>
    <div
      class="overflow-hidden text-sm"
      :class="[inversion ? 'items-end' : 'items-start']"
    >
      <p
        class="text-xs text-[#b4bbc4]"
        :class="[inversion ? 'text-right' : 'text-left']"
      >
        {{ dateTime }}
      </p>
      <div
        class="flex items-end gap-1 mt-2"
        :class="[inversion ? 'flex-row-reverse' : 'flex-row']"
      >
        <TextComponent
          ref="textRef"
          :inversion="inversion"
          :commentable="commentable"
          :error="error"
          :text="text"
          :duration="duration"
          :sentenceInfo="sentenceInfo"
          :loading="loading"
          :as-raw-text="asRawText"
          :type="type"
          :isLogMode="isLogMode"
          :submited="submited"
          @scrollToBottom="scrollToBottom"
          @chatBotStrategyExecutor="chatBotStrategyExecutor"
          @showSentenceInfo="emit('showSentenceInfo')"
          @finishSubmit="emit('finishSubmit')"
          @play-audio="emit('playAudio')"
        />
        <!-- 相似问题答案没有按钮 -->
        <div class="flex flex-col" v-if="!isLogMode">
          <button
            v-if="!inversion && requestOptions.prompt"
            class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            @click="handleRegenerate"
          >
            <SvgIcon icon="ri:restart-line" />
          </button>
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect"
          >
            <button
              class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div>
        <!-- 点赞点踩按钮 -->
        <div class="flex flex-col" v-if="commentable">
          <button
            v-if="feedback != 2"
            class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            @click="emit('thumbUp')"
            :disabled="feedback === 1"
          >
            <SvgIcon
              :color="feedback === 1 ? 'green' : ''"
              icon="material-symbols:thumb-up-outline"
            />
          </button>
          <button
            v-if="feedback != 1"
            class="mt-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200"
            @click="emit('thumbDown')"
            :disabled="feedback === 2"
          >
            <SvgIcon
              :color="feedback === 2 ? 'red' : ''"
              icon="material-symbols:thumb-down-outline"
            />
          </button>
        </div>
        <!-- 会话日志点赞点踩按钮 -->
        <div class="flex flex-col" v-if="isLogMode">
          <button
            v-if="feedback == 1"
            class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            :disabled="feedback === 1"
          >
            <SvgIcon
              :color="feedback === 1 ? 'green' : ''"
              icon="material-symbols:thumb-up-outline"
            />
          </button>
          <button
            v-if="feedback == 2"
            class="mt-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200"
            :disabled="feedback === 2"
          >
            <SvgIcon
              :color="feedback === 2 ? 'red' : ''"
              icon="material-symbols:thumb-down-outline"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
