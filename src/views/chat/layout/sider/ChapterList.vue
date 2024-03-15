
<script setup lang="ts">
import { computed, ref, watch } from "vue";

import PDFJS from 'pdfjs-dist'
PDFJS.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url);

import {
  NScrollbar,
  NCheckboxGroup,
  NCheckbox,
  NSpace,
  useMessage,
  NModal,
  NSpin,
	NRadio,
	NButton,
	NRadioGroup
} from "naive-ui";
import { SvgIcon } from "@/components/common";
import { useChatStore } from "@/store";
import {localCVs} from "./localCV"
import apiRobot from "@/api/apiRobot";
import {t} from "@/locales";

interface Emit {
  (ev: "handlePreview", item: any): void;
}
const emit = defineEmits<Emit>();
const ms = useMessage()
const chatStore = useChatStore();
const loading = ref(false);
const CvString = ref()
const selectedCv=ref()
const localPdf=ref([])
const dataSources = computed(() => chatStore.history);
const instanceInfo = computed(
  () => chatStore.getChatHistoryByCurrentActive?.instanceInfo
);

const chapters: any = ref([]);

const checkedChapters: any = ref(
  chatStore.getChatHistoryByCurrentActive?.checkedChapters
);
const selectAll = ref(false);
const findPageChatBotChapterCorpusDocs = async () => {
  loading.value = true;
	chapters.value = localCVs.content;
  loading.value = false;
};
function getPdfFile(item: any){
	const fileName=item.chapterName;
	const foundFile = localPdf.value.find((item: { fileName: any; }) => item.fileName === fileName);
	if (foundFile) {
		// 如果找到了匹配的项，则可以通过 foundFile.pdf 访问对应的文件对象
		return foundFile.pdf;
		// 现在你可以操作 file 对象，例如上传、下载等操作
	} else {
		ms.error("未找到"+fileName)
	}
}
const getPageText = async (pdf:any, pageNo: number) => {
	const page = await pdf.getPage(pageNo);
	const tokenizedText = await page.getTextContent();
	// console.log(tokenizedText);
	const pageText = tokenizedText.items.map((token:any) => token.str).join('');
	return pageText;
};
const getPDFText = async (source: any): Promise<string> => {
	const pdf = await PDFJS.getDocument(source).promise;
	const maxPages = pdf.numPages;
	const pageTextPromises: any = [];
	for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
		pageTextPromises.push(getPageText(pdf, pageNo));
	}
	const pageTexts: any = await Promise.all(pageTextPromises);
	return pageTexts;
};
function handleSelectedCvString(value: any) {
  console.log(value.target.value)
	selectedCv.value =value.target.value
}
function handleSaveCvString(){
	localStorage.setItem('selectedCv',selectedCv.value)
	ms.success("简历切换成功")
}
function importData(event: Event): void {
	const target = event.target as HTMLInputElement
	if (!target || !target.files)
		return
	const file: File = target.files[0]
	if (!file)
		return
	const fileType = file.type;
	const fileName = file.name;
	const reader: FileReader = new FileReader()
	if (fileType === 'application/pdf') {
		reader.onload = async function () {
			const arrayBuffer: any = reader.result;
			const textList: any = await getPDFText(arrayBuffer);
			// console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",textList.toString());
			if(textList){
				CvString.value=textList.toString()
				// localStorage.setItem('CvString',textList.toString())
				localCVs.content.push({
					"chapterRowKey":new Date().toLocaleString(),
					"chapterName": fileName,
					"chapterContent": textList.toString(),
					"chapterKeyWords": [
						fileName
					],
					"instanceId": 200,
					"chapterFileUrl": "localhost:12450/foobar ",
					"createTime": null,
					"updateTime": null
				});
				await findPageChatBotChapterCorpusDocs();
				localPdf.value.push({
					fileName: fileName,
					pdf: file
				})
				// localStorage.setItem('localCVs',textList.toString())
				ms.success("简历导入成功")
			}
			// setResult(transfer(textList));
		};
	}else{
		ms.error("不支持的文件格式，请上传PDF")
	}
	reader.readAsArrayBuffer(file)
}


function handleUploadClick() {
	const fileInput = document.getElementById('fileInput') as HTMLElement
	if (fileInput)
		fileInput.click()
}
findPageChatBotChapterCorpusDocs();

watch(
  checkedChapters,
  (val) => {
    if (chatStore.active)
      chatStore.updateHistoryCheckedChapters(chatStore.active, {
        checkedChapters: [val],
      });
  },
  {
    immediate: true,
    flush: "post",
  }
);
</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!dataSources.length">
        <div
          class="flex flex-col items-center mt-4 text-center text-neutral-300"
        >
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t("common.noData") }}</span>
        </div>
      </template>
      <template v-else>
				<div class="py-3 flex items-center justify-between">
					<span>选择简历信息</span>
					<!-- 添加全选复选框 -->
<!--					<NCheckbox v-model:checked="selectAll" @change="handleSelectAll">全选</NCheckbox>-->
					<input id="fileInput" type="file" style="display:none" @change="importData">
					<n-button strong secondary round type="info" @click="handleUploadClick">
						<template #icon>
							<SvgIcon icon="ri:upload-2-fill" />
						</template>
						上传PDF
					</n-button>
				</div>

				<NSpin :show="loading" :delay="300" style="min-height: 300px">
					<NRadioGroup v-model:value="checkedChapters" @change="handleSelectedCvString">
						<NSpace item-style="display: flex;">
							<template v-for="(item, index) of chapters" :key="index">
								<NRadio :value="item.chapterContent"></NRadio>
								<a
									:title="item.chapterName"
									class="relative inline-block w-[200px] cursor-pointer text-[#1890ff] truncate"
									@click="emit('handlePreview', getPdfFile(item))"
								>
									{{ item.chapterName }}
								</a>
							</template>
						</NSpace>
					</NRadioGroup>

					<div style="display: flex; justify-content: flex-end; margin-top: 10px;">
						<n-button tertiary type="info" @click="handleSaveCvString">
							确认选择
						</n-button>
					</div>
        </NSpin>
      </template>
    </div>
  </NScrollbar>
</template>
