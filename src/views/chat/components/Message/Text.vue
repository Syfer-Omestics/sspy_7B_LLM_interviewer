<script lang="ts" setup>
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import MarkdownIt from "markdown-it";
import mdKatex from "@traptitech/markdown-it-katex";
import mila from "markdown-it-link-attributes";
import { HoverButton, SvgIcon } from "@/components/common";
import hljs from "highlight.js";
import { useBasicLayout } from "@/hooks/useBasicLayout";
import { t } from "@/locales";
import { copyToClip } from "@/utils/copy";
import { useChat } from "../../hooks/useChat";
import { useRoute } from "vue-router";
import {
  NRadioGroup,
  NSpace,
  NRadio,
  NInput,
  NButton,
  NFormItem,
  NCollapseTransition,
} from "naive-ui";
import SentenceInfo from "../../components/SentenceInfo/index.vue";
import { useChatStore } from "@/store";
interface Props {
  inversion?: boolean;
  error?: boolean;
  text?: any;
  duration?: number;
  playing?: boolean;
  loading?: boolean;
  asRawText?: boolean;
  type?: string;
  commentable?: boolean;
  sentenceInfo?: any;
  isLogMode?: any;
  submited?: boolean;
}
interface Emit {
  (ev: "scrollToBottom"): void;
  (ev: "chatBotStrategyExecutor"): void;
  (ev: "showSentenceInfo"): void;
  (ev: "finishSubmit"): void;
  (ev: "playAudio"): void;
}

const chatStore = useChatStore();
const instanceInfo = computed(
  () => chatStore.getChatHistoryByCurrentActive?.instanceInfo
);
const props = defineProps<Props>();
const emit = defineEmits<Emit>();
const { isMobile } = useBasicLayout();
const { addChat } = useChat();

const route = useRoute();
const { uuid } = route.params as { uuid: string };
const textRef = ref<HTMLElement>();

const mdi = new MarkdownIt({
  // html: false,
  html: true,
  linkify: true,
  highlight(code, language) {
    const validLang = !!(language && hljs.getLanguage(language));
    if (validLang) {
      const lang = language ?? "";
      return highlightBlock(
        hljs.highlight(code, { language: lang }).value,
        lang
      );
    }
    return highlightBlock(hljs.highlightAuto(code).value, "");
  },
});

mdi.use(mila, { attrs: { target: "_blank", rel: "noopener" } });
mdi.use(mdKatex, {
  blockClass: "katexmath-block rounded-md p-[10px]",
  errorColor: " #cc0000",
});

const wrapClass = computed(() => {
  return [
    "text-wrap",
    "min-w-[20px]",
    "rounded-md",
    isMobile.value ? "p-2" : "px-3 py-2",
    props.inversion ? "bg-[#18B6FFFF]" : "bg-[#f4f6f8]",
    props.inversion ? "dark:bg-[#18B6FFFF]" : "dark:bg-[#1e1e20]",
    props.inversion ? "message-request" : "message-reply",
    { "text-red-500": props.error },
  ];
});

const text = computed(() => {
  const value = props.text ?? "";
  if (!props.asRawText) {
    // asRawText = inversion true:问题 false回答
    if (
      props.type === "richtext" || // 处理图片带多的引号
      props.type === "list" ||
      props.type === "checkpoint"
    ) {
      return value;
    } else {
      return mdi.render(value); // 代码块
    }
  }
  return value;
});

function highlightBlock(str: string, lang?: string) {
  return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t(
    "chat.copyCode"
  )}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`;
}

function addCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll(".code-block-header__copy");
    copyBtn.forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.parentElement?.nextElementSibling?.textContent;
        if (code) {
          copyToClip(code).then(() => {
            btn.textContent = "复制成功";
            setTimeout(() => {
              btn.textContent = "复制代码";
            }, 1000);
          });
        }
      });
    });
  }
}

function removeCopyEvents() {
  if (textRef.value) {
    const copyBtn = textRef.value.querySelectorAll(".code-block-header__copy");
    copyBtn.forEach((btn) => {
      btn.removeEventListener("click", () => {});
    });
  }
}

onMounted(() => {
  addCopyEvents();
});

onUpdated(() => {
  addCopyEvents();
});

onUnmounted(() => {
  removeCopyEvents();
});

// 多轮收集提交
const submit = () => {
  const unfillValues = text.value.filter((t: any) => !t.questionValue);
  if (!unfillValues.length) {
    emit("chatBotStrategyExecutor");
    emit("finishSubmit");
  }
};
// 相似问题点击
const handleQaItemClick = (answer: string) => {
  addChat(+uuid, {
    dateTime: new Date().toLocaleString(),
    type: "richtext",
    text: answer,
    loading: false,
    inversion: false,
    error: false,
    conversationOptions: null,
    requestOptions: { prompt: "", options: null },
  });
  // 触发滚动到底部
  emit("scrollToBottom");
};
</script>

<template>
  <div
    class="text-black"
    :class="wrapClass"
    v-viewer="{
      inline: false,
    }"
  >
    <div ref="textRef" class="leading-relaxed break-words">
      <div v-if="type === 'checkpoint'">
        <div v-for="(item, index) in text" :key="index">
          <div className="mb-2 font-bold">{{ item.questioningScript }}</div>
          <div v-if="item.answerStrategy === 'CHOOSE'">
            <NRadioGroup
              v-model:value="item.questionValue"
              name="radiogroup"
              :disabled="isLogMode"
            >
              <NSpace>
                <NRadio v-for="(c, i) in item.choices" :value="c" :key="i">{{
                  c
                }}</NRadio>
              </NSpace>
            </NRadioGroup>
          </div>
          <div v-else>
            <NFormItem :label="item.questionKey" label-placement="left">
              <NInput
                v-model:value="item.questionValue"
                @change="
                  (value) => {
                    item.questionValue = value;
                  }
                "
                :disabled="isLogMode || submited"
              ></NInput>
            </NFormItem>
          </div>
        </div>
        <div class="flex place-content-end">
          <NButton
            type="primary"
            @click="submit"
            size="small"
            :disabled="isLogMode || submited"
          >
            提交
          </NButton>
        </div>
      </div>
      <div v-else-if="type === 'list'">
        <div class="font-bold">你可能想问：</div>
        <div
          class="cursor-pointer py-2"
          v-for="(item, index) in text"
          :key="index"
          @click="() => handleQaItemClick(item.answer)"
        >
          {{ item.question }}
        </div>
      </div>
      <div
        v-else-if="type === 'audio'"
        class="flex place-items-center cursor-pointer"
        @click="emit('playAudio')"
      >
        <span class="mx-2"
          >{{ duration && (duration / 1000).toFixed(0) }}"</span
        >
        <span class="text-lg">
          <SvgIcon class="-rotate-90" icon="svg-spinners:wifi" v-if="playing" />
          <SvgIcon
            class="-rotate-90"
            icon="material-symbols:wifi-sharp"
            v-else
          />
        </span>
      </div>
      <div v-else>
        <div v-if="!inversion">
          <div v-if="!asRawText" class="markdown-body">
            <span v-html="text"></span>
            <div>
              <a
                href="javascript:void(0);"
                v-if="!loading && sentenceInfo?.paragraphRowKey"
                @click="emit('showSentenceInfo')"
                >{{ sentenceInfo?.show ? "收起" : "查看依据" }}</a
              >
            </div>
          </div>
          <div v-else class="whitespace-pre-wrap" v-text="text" />
        </div>
        <div v-else class="whitespace-pre-wrap" v-text="text"></div>
      </div>
      <template v-if="loading">
        <span v-if="type === 'audio'" class="text-xl" :class="'text-[#1890ff]'">
          <SvgIcon icon="svg-spinners:bars-scale-middle" />
        </span>
        <span v-else class="text-xl" :class="'text-[#1890ff]'">
          <SvgIcon icon="svg-spinners:6-dots-rotate" />
        </span>
      </template>
    </div>

    <!-- <NCollapseTransition
      :show="!loading && sentenceInfo?.paragraphRowKey && sentenceInfo?.show"
    > -->
    <div v-if="!loading && sentenceInfo?.paragraphRowKey && sentenceInfo?.show">
      <SentenceInfo
        :sentenceInfo="sentenceInfo"
        :instanceId="instanceInfo.id"
      ></SentenceInfo>
    </div>
    <!-- </NCollapseTransition> -->
  </div>
</template>

<style lang="less">
@import url(./style.less);
</style>
