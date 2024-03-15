
<script lang="ts" setup>
import { watch, ref, onUpdated } from "vue";
import { NTag, NDivider } from "naive-ui";

interface Props {
  sentenceInfo: any;
  instanceId: any;
}

interface Emit {
  (ev: "export"): void;
  (ev: "toggleUsingContext"): void;
}

// const { scrollRef, scrollToPosition } = useScroll();
const props = defineProps<Props>();
const {
  sentenceInfo: { paragraphRowKey, sentenceText },
} = props;

const emit = defineEmits<Emit>();

const paragraphCorpusDocs = ref<any>(null);

const findPageChatBotParagraphCorpusDocsByRowKey = async (
  chapterRowKey: string
) => {
  const res = await apiRobot.findPageChatBotParagraphCorpusDocsByRowKey({
    chapterRowKey,
  });
  console.log(res);
  paragraphCorpusDocs.value = res.data;
};
// 滚动到高亮段落位置

const highlightSentence = (paragraphText: string) => {
  const regExp = new RegExp(sentenceText);
  return paragraphText.replace(
    regExp,
    `<span id="highligh_sentence" style="background: yellow;">${sentenceText}</span>`
  );
};

const scrollToPosition = (top: number) => {
  const dom = document.getElementById("sententInfoSroll")?.parentElement;
  dom && (dom.scrollTop = top - 300);
};

onUpdated(() => {
  const dom = document.getElementById("highligh_sentence");
  console.log(dom?.offsetTop);
  dom?.offsetTop && scrollToPosition(dom?.offsetTop);
});

watch(
  props.sentenceInfo,
  (val) => {
    console.log(val);
    const { chapterRowKey } = val;
    chapterRowKey && findPageChatBotParagraphCorpusDocsByRowKey(chapterRowKey);
  },
  {
    immediate: true,
    flush: "post",
  }
);
</script>

<template>
  <div class="m-2" id="sententInfoSroll">
    <div v-for="(item, index) in paragraphCorpusDocs" :key="index">
      <div
        :class="
          item.paragraphRowKey === paragraphRowKey && [
            'border-[#1890ff]',
            'bg-neutral-200',
            'dark:bg-[#24272e]',
            'dark:border-[#4b9e5f]',
            'pr-14',
          ]
        "
      >
        <span
          v-html="
            item.paragraphRowKey === paragraphRowKey
              ? highlightSentence(item.paragraphText)
              : item.paragraphText
          "
        >
        </span>
      </div>
      <div class="mt-4">
        <NTag type="info" v-for="(t, i) in item.pictureInfoDTOList" :key="i">{{
          t.pictureName
        }}</NTag>
      </div>
      <NDivider />
    </div>
  </div>
</template>
