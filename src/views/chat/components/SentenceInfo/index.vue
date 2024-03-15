
<script lang="ts" setup>
import { watch, ref, onUpdated } from "vue";
import { NTag, NDivider } from "naive-ui";
import apiRobot from "@/api/apiRobot";

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

const emit = defineEmits<Emit>();

// const paragraphCorpusDocs = ref<any>(null);
const targetParagraph = ref<any>(null);

const findChatBotParagraphDocsByParagraphRowKey = async () => {
  const {
    sentenceInfo: { paragraphRowKey },
  } = props;
  const res = await apiRobot.findChatBotParagraphDocsByParagraphRowKey({
    paragraphRowKey,
  });
  console.log(res);
  // paragraphCorpusDocs.value = res.data;
  targetParagraph.value = res.data;
};
// 滚动到高亮段落位置

const highlightSentence = (paragraphText: string) => {
  const {
    sentenceInfo: { sentenceText },
  } = props;
  const regExp = new RegExp(sentenceText);
  return paragraphText.replace(
    regExp,
    `<span id="highligh_sentence" style="background: yellow;">${sentenceText}</span>`
  );
};

// const scrollToPosition = (top: number) => {
//   const dom = document.getElementById("sententInfoSroll")?.parentElement;
//   dom && (dom.scrollTop = top - 300);
// };

// onUpdated(() => {
//   const dom = document.getElementById("highligh_sentence");
//   dom?.offsetTop && scrollToPosition(dom?.offsetTop);
// });

watch(
  props.sentenceInfo,
  (val) => {
    const chapterRowKey = val?.chapterRowKey;
    chapterRowKey && findChatBotParagraphDocsByParagraphRowKey();
  },
  {
    immediate: true,
    flush: "post",
  }
);
</script>

<template>
  <div class="m-2" id="sententInfoSroll" v-if="targetParagraph">
    <!-- <div v-for="(item, index) in paragraphCorpusDocs" :key="index"> -->
    <div>
      <span
        class="markdown-body"
        v-html="
          // item.paragraphRowKey === paragraphRowKey
          //   ? highlightSentence(item.paragraphText)
          //   : item.paragraphText
          targetParagraph.richText
            ? highlightSentence(targetParagraph.richText)
            : highlightSentence(targetParagraph.paragraphText)
        "
      >
      </span>
    </div>
    <div class="mt-4">
      <NTag
        type="info"
        v-for="(t, i) in targetParagraph.pictureInfoDTOList"
        :key="i"
        >{{ t.pictureName }}</NTag
      >
    </div>
    <NDivider />
  </div>
  <!-- </div> -->
</template>
