<script setup lang="ts">
import {Ref} from "vue";
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useRoute} from "vue-router";
import {storeToRefs} from "pinia";
import {format} from "date-fns";
import {
	NAutoComplete,
	NButton,
	NInput,
	useDialog,
	useMessage,
	NDrawer,
	NDrawerContent,
} from "naive-ui";
import html2canvas from "html2canvas";
import {Message} from "./components";
import {useScroll} from "./hooks/useScroll";
import {useChat} from "./hooks/useChat";
import {useUsingContext} from "./hooks/useUsingContext";
import {useUsingAudio} from "./hooks/useUsingAudio";
import {useStreamAudio} from "./hooks/useStreamAudio";
import {useRecorder} from "./hooks/useRecorder";
import HeaderComponent from "./components/Header/index.vue";
import Complain from "./components/Complain/index.vue";
import Prefill from "./components/Prefill/index.vue";
import {HoverButton, SvgIcon} from "@/components/common";
import {useBasicLayout} from "@/hooks/useBasicLayout";
import {useChatStore, usePromptStore} from "@/store";
import {isJsonString} from "@/utils/is";
// import { wavToMp3 } from "@/utils/functions/wavToMp3";
// import { fetchChatAPIProcess } from "@/api";
import apiRobot from "@/api/apiRobot";
import apiLog from "@/api/apiLog";
import {v4 as uuidv4} from "uuid";
import {t} from "@/locales";
import {base64ToBlob} from "@/utils/functions/base64ToBlob";

let controller = new AbortController();
let wavesurfer: any = null;
// const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === "true";
const showModal = ref<boolean>(false);
const showDrawer = ref(false);
const sentenceInfo = ref<any>();
const sessionId = ref<any>(null);
const roundsRemain=ref<number>(2);
const interviewing =computed(() => !!roundsRemain.value);
const route = useRoute();
const dialog = useDialog();
const ms = useMessage();
const cvString=ref();
const chatStore = useChatStore();
const {isMobile} = useBasicLayout();
const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} =
	useChat();
const {scrollRef, scrollToBottom, scrollToBottomIfAtBottom} = useScroll();
const {usingContext, toggleUsingContext} = useUsingContext();
const {usingAudio, toggleUsingAudio} = useUsingAudio();
const qList =ref(<string[]>[]);
const aList=ref<string[]>([]);
// const areBothListsGrowing = computed(() => {
// 	return qList.value.length === aList.value.length - 1 ||
// 		aList.value.length === qList.value.length - 1;
// });
//
// // 监听 qList 和 aList 的变化
// import {watch} from "vue";
// watch(
// 	[qList.value, aList.value],
// 	(newValue, oldValue) => {
// 		if (areBothListsGrowing.value && newValue.every((list, index) => list.length > oldValue[index].length)) {
// 			roundsRemain.value--;
// 			console.log("roundsRemain.value", roundsRemain.value);
// 		}
// 	},
// 	{ deep: true }
// );
const {
	initRecorder,
	startRecord,
	stopRecord,
	isRecording,
	recorder,
	mp3Blob,
} = useRecorder();
const evaluationPrompt="请根据以下简历文字，向受试者提出一个最有针对性的问题。你只能提一个问题。";

const audio = document.createElement("audio");
document.body.prepend(audio);
audio.controls = false;

const {uuid} = route.params as { uuid: string };
const {instanceId, chatId} = route.query as {
	instanceId: string;
	chatId: string;
};
const isLogMode = computed(() => uuid === "log");

const dataSources = computed(() =>
	isLogMode.value ? logSources.value : chatStore.getChatByUuid(+uuid)
);

// 会话日志
const logSources = ref([]);
const getSessionLogs = async () => {
	const getContent = (d: any) => {
		const {sessionType, sessionContent} = d;
		switch (sessionType) {
			case "QUESTION":
				return {
					text: sessionContent.data,
					type: "richtext",
				};
			case "UNKNOWN_QUESTION_REPLY":
				return {
					text: sessionContent.data,
					type: "richtext",
				};
			case "ANSWER":
				return {
					text: sessionContent.text || sessionContent.data.answer,
					type: "richtext",
				};
			case "REC_ANSWER":
				return {
					text: sessionContent.data,
					type: "list",
				};
			case "MULTI_ROUND":
				return {
					text: sessionContent.data.answer || sessionContent.data,
					type: "checkpoint",
				};
		}
	};
	const res = await apiLog.getSessionLogs({instanceId, chatId});
	console.log(res.data);
	const temp = res.data.reduce((prev: any, cur: any) => {
		const sessionType = cur.sessionType;
		if (sessionType === "ANS_DOWNVOTE" || sessionType === "REC_DOWNVOTE") {
			// let index = prev.find(p => p.sessionId === cur.sessionId)
			prev.find((p: any) => p.sessionId === cur.sessionId).feedback = 2;
		} else if (sessionType === "ANS_UPVOTE" || sessionType === "REC_UPVOTE") {
			prev.find((p: any) => p.sessionId === cur.sessionId).feedback = 1;
		} else if (sessionType === "REPORT" || sessionType === "NONE_TYPE") {
			// prev.push(cur);
		} else {
			prev.push(cur);
		}
		return prev;
	}, []);
	console.log(temp);
	logSources.value = temp.map((d: any) => {
		return Object.assign(
			{
				dateTime: d.createdAt,
				feedback: d.feedback,
				inversion: d.sessionType === "QUESTION",
				error: false,
				conversationOptions: null,
				requestOptions: {prompt: null, options: null},
			},
			getContent(d)
		);
	});
};

if (isLogMode.value) {
	getSessionLogs();
}

const instanceInfo = computed(
	() => chatStore.getChatHistoryByCurrentActive?.instanceInfo
);
// 已选篇章
const checkedChapters = computed(
	() => chatStore.getChatHistoryByCurrentActive?.checkedChapters
);

//简历问答模式，模拟面试官：0， 智能简历问答：
const resumeType = computed(
	() => chatStore.getChatHistoryByCurrentActive?.resumeType
);

const conversationList = computed(() =>
	// console.log(dataSources.value);
	dataSources.value?.filter(
		// 过滤出机器人发的消息
		(item) => !item.inversion && !!item.conversationOptions
	)
);

// streamChat历史记录
const history = computed(() => {
	const temp: any = [];
	console.log(conversationList.value);
	if (!conversationList.value.length) {
		console.log("empty Conversation List")
		let options: Chat.ConversationRequest = {};
		if (resumeType.value === 0) {

		} else if (resumeType.value === 1) {
			temp.push(
				{
					role: "user",
					content: "你将扮演一位资深的人力资源管理师，而我是你的领导，你擅长理解求职者的简历内容并根据简历回答问题，同时你也能够对比多份简历并回答问题。接下来的对话中，我将向你提供简历信息。如果我没有向你提问更多问题，请你对简历内容进行简要概括，否则就回答我对简历提出的问题。以下是简历内容："+cvString.value
				});
			temp.push(
				{
					metadata: "",
					role: "assistant",
					content: "好的，请提供简历信息"
				});
		}
	} else {
		conversationList.value.slice(-5).forEach((item) => {
			// 5条历史记录
			temp.push({
				role: "user",
				content: item.requestOptions.prompt,
			});
			temp.push({
				metadata: "",
				role: "assistant",
				content: item.text,
			});
		});
	}
	// console.log(temp, "========================================")
	return temp;
	// conversationList.value.map((item) => [item.requestOptions.prompt, item.text]);
});

const prompt = ref<string>("");
const loading = ref<boolean>(false);
const inputRef = ref<Ref | null>(null);

// 添加PromptStore
const promptStore = usePromptStore();

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const {promptList: promptTemplate} = storeToRefs<any>(promptStore);

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
	if (item.loading) updateChatSome(+uuid, index, {loading: false});
});

//将问题和答案交替存入数组
function alternateAppend(arr1:string[], arr2:string[], result = '') {
	while (arr1.length > 0 || arr2.length > 0) {
		if (arr1.length > 0) {
			result += 'Interviewer: '+arr1.shift()+'  ';
		}
		if (arr2.length > 0) {
			result += 'Candidate: '+arr2.shift()+'  ';
		}
	}
	return result;
}
function handleSubmit() {
	let message = prompt.value;
	cvString.value=localStorage.getItem('selectedCv')
	if(!cvString.value){
		return
	}
	console.log(interviewing,roundsRemain.value,"++++++++++++++++++++++++++++++++++++++++++++++++++++++")
	if (resumeType.value===0){
		if (interviewing.value){
			// roundsRemain.value--;
			aList.value.push(message);
			let conv="###你将扮演面试官的角色，以下是申请者此前与面试官的对话记录以及提供的简历（申请者可能在简历中说谎，请批判性解读）。请根据这些信息向申请者提出一个问题。你需要提出一个与此前不同的问题，也可以承接申请者的回答内容深入追问。你只能提出一个问题。请直接对申请者进行提问，不要有多余的前置内容(例如\"我提出以下问题：\") ###";
			conv= conv+"  ###此前与面试官的问答###:  "+alternateAppend(qList.value, aList.value)+"   ###简历###: "+cvString.value;
			onConversationWithPromptInjection(conv)
			roundsRemain.value--
		} else {
			let conv="###以下是申请者此前与面试官的问答，请根据这些信息对面试者生成一个客观的评价，格式：【简历总结】（综合性评价简历内容，100字）；【面试总结】（只参考此前与面试官的问答，100字）；【面试评价】（只给出 优/良/合格/较合格/不合格的等第即可） ###";
			conv= conv+"  ###此前与面试官的问答###:  "+alternateAppend(qList.value, aList.value)+"   ###简历###: "+cvString.value;
			onConversationWithPromptInjection(conv)
		}
	} else if (resumeType.value===1){
		let conv ="请依据简历的内容并凝练、简要地回答问题。请注意，问什么就回答什么，不要回答冗余的内容！ 问题："+message+ "   简历内容："+cvString.value;
		onConversationWithPromptInjection(conv)
	}

}

// 大模型聊天
const streamChat = async (message: any, options: any, index?: any) => {
	const response = await fetch("/apiStream/stream_chat", {
		// const response = await fetch("/apiStream/questionAnswering/streamingExecutor", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		signal: controller.signal,
		body: JSON.stringify({
			prompt: message,
			// history: usingContext.value ? history.value.slice(-5) : [], // 5条历史记录
			history: usingContext.value ? history.value : [],
		}),
	});
	if (response.body) {
		const reader = response.body.getReader();
		let result = "";

		while (true) {
			const {done, value} = await reader.read();
			if (done) {
				updateChatSome(+uuid, !index ? dataSources.value.length - 1 : index, {
					loading: false,
				});
				break;
			}
			const chunk = new TextDecoder("utf-8").decode(value);
			result += chunk;

			// 在这里处理返回的数据
			updateChat(+uuid, !index ? dataSources.value.length - 1 : index, {
				dateTime: new Date().toLocaleString(),
				text: result,
				inversion: false,
				error: false,
				loading: false,
				conversationOptions: {
					conversationId: "conversationId",
					parentMessageId: "parentMessageId", // 上条消息id 后端没有
				},
				requestOptions: {prompt: message, options: {...options}},
			});
			scrollToBottomIfAtBottom();
		}
	}
};

// 会话日志
const saveSessionLog = async (sessionId: string, logList: any) => {
	const instanceId = instanceInfo.value.id;
	const now = new Date();
	apiLog.saveSessionLog(
		{instanceId},
		logList.map((l: any) => {
			l.sessionId = sessionId;
			l.chatId = uuid;
			l.sessionTime = format(now, "yyyy-MM-dd HH:mm:ss");
			return l;
		})
	);
};

// 未知问题推送
const handleHardQuestion = async (sessionId: string, question: string) => {
	console.log(instanceInfo.value);

	let data = {
		sessionId: sessionId,
		instanceId: instanceInfo.value.id,
		requestParams: {
			question,
		},
	};
	console.log(data);
	let questionRes = await apiLog.handleHardQuestions(data);
	console.log(questionRes);
};

// 处理问答接口返回体
const handleChatBotResponce = async (
	data: any,
	sessionId: any,
	message: string,
	options: any,
	checkpoints: any,
	index: any,
	streamAnswer?: any
) => {
	const {instanceType} = instanceInfo.value;
	let answer = streamAnswer;
	let type = streamAnswer ? "" : "richtext"; // 默认richtext，流式问答为空
	let logList: any = [];
	let commentable = false;
	let {responseType, responseParams} = data;
	if (!responseParams) {
		responseParams = {};
	}

	const {chapterRowKey, paragraphRowKey, sentenceText, history} =
		responseParams;
	switch (responseType) {
		case "TAIL":
			responseParams?.answer && (answer = responseParams.answer);

			if (instanceType === "Search" && responseParams?.richText) {
				answer = responseParams.richText;
			}

			// 存在段落依据 则加入图片
			if (paragraphRowKey) {
				const resPic = await apiRobot.findPictureUrlByParagraphRowKey({
					paragraphRowKey,
				});
				console.log(resPic);
				resPic.data?.forEach((item: string) => {
					answer += `<img src=${encodeURI(item)}>`;
				});
			}
			logList = [
				{
					sessionContent: {
						data: message,
					},
					sessionType: "QUESTION",
				},
			];
			if (checkpoints) {
				logList.push({
					sessionContent: {
						data: checkpoints,
					},
					sessionType: "MULTI_ROUND",
				});
			}
			logList.push({
				sessionContent: {
					data: responseParams,
					text: answer, // 富文本答案
				},
				sessionType: "ANSWER",
			});
			commentable = true;
			saveSessionLog(sessionId, logList);
			break;
		case "CHECKPOINT":
			answer = responseParams.answer;
			type = "checkpoint";
			break;
		case "EXPIRED":
			answer = "会话已过期，请重新进入。";
			break;
		case "UNPUBLISHED":
			answer = "机器人未上线，暂时无法回答";
			break;
		case "UNKNOWN":
			answer = "机器人暂时无法回答该问题~";
			handleHardQuestion(sessionId, message);
			logList = [
				{
					sessionContent: {
						data: message,
					},
					sessionType: "QUESTION",
				},
				{
					sessionContent: {
						data: answer,
					},
					sessionType: "UNKNOWN_QUESTION_REPLY",
				},
			];
			saveSessionLog(sessionId, logList);
			break;
		case "SIMILAR_RECOMMEND":
			logList = [
				{
					sessionContent: {
						data: message,
					},
					sessionType: "QUESTION",
				},
				{
					sessionContent: {
						data: responseParams.similar_question || responseParams.answer,
					},
					sessionType: "REC_ANSWER",
				},
			];
			saveSessionLog(sessionId, logList);
			answer = responseParams.similar_question || responseParams.answer;
			type = "list";
			commentable = true;
			break;
	}

	if (!answer) {
		answer = "机器人暂时无法回答该问题~"; // 接口返回空字符串
		commentable = false;
	}

	updateChat(
		+uuid,
		!index || index === -1 ? dataSources.value.length - 1 : index,
		{
			dateTime: new Date().toLocaleString(),
			text: answer,
			commentable: commentable,
			sentenceInfo: {chapterRowKey, paragraphRowKey, sentenceText},
			sessionId,
			question: message,
			inversion: false,
			type: type,
			error: false,
			loading: false,
			conversationOptions: {
				conversationId: "conversationId",
				parentMessageId: "parentMessageId", // 上条消息id 后端没有
				history,
			},
			requestOptions: {prompt: message, options: {...options}},
		}
	);

	scrollToBottomIfAtBottom();
	scrollToBottom();
};

// 机器人实例聊天
const chatBotStrategyExecutor = async (
	message: any,
	options: any,
	sessionId: any,
	checkpoints?: any,
	index?: any // 更新消息的索引,-1表示多轮表单收集
) => {
	const {id: instanceId, token} = instanceInfo.value;
	if (index === -1) {
		addChat(+uuid, {
			dateTime: new Date().toLocaleString(),
			text: "",
			loading: true,
			inversion: false,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		});
	}

	const res = await apiRobot.chatBotStrategyExecutor(
		{
			instanceId,
			sessionId,
			token,
		},
		{
			question: message,
			answer: checkpoints,
			chapterRowKeyList:
				instanceInfo.value.knowledgeLearnType === "CHAPTERS_LEARN" &&
				checkedChapters.value?.length
					? JSON.stringify(checkedChapters.value)
					: null,
			history: options.history,
		},
		controller.signal
	);

	console.log(checkedChapters.value);

	// 后端会话已结束但是状态是tail，提前判断一层
	if (res.code == 806 || res.code == 500) {
		updateChat(
			+uuid,
			!index || index === -1 ? dataSources.value.length - 1 : index,
			{
				dateTime: new Date().toLocaleString(),
				text: res.msg,
				commentable: false,
				sessionId,
				question: message,
				inversion: false,
				type: "richtext",
				error: false,
				loading: false,
				conversationOptions: {
					conversationId: "conversationId",
					parentMessageId: "parentMessageId", // 上条消息id 后端没有
				},
				requestOptions: {prompt: message, options: {...options}},
			}
		);
		scrollToBottomIfAtBottom();
		return;
	}

	handleChatBotResponce(
		res.data,
		sessionId,
		message,
		options,
		checkpoints,
		index
	);
};

// 机器人流式聊天
const chatBotStrategyStreamingExecutor = async (
	message: any,
	options: any,
	sessionId: any,
	checkpoints?: any,
	index?: any // 更新消息的索引,-1表示多轮表单收集
) => {
	const {id: instanceId, token} = instanceInfo.value;
	if (index === -1) {
		addChat(+uuid, {
			dateTime: new Date().toLocaleString(),
			text: "",
			loading: true,
			inversion: false,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		});
	}

	const response = await fetch(
		`/sqacp/questionAnswering/chatBotStrategyStreamingExecutor?instanceId=${instanceId}&sessionId=${sessionId}&token=${token}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			signal: controller.signal,
			body: JSON.stringify({
				question: message,
				answer: checkpoints,
				streaming: true,
				chapterRowKeyList: checkedChapters.value?.length
					? JSON.stringify(checkedChapters.value)
					: null,
				history: usingContext.value ? history.value : [],
			}),
		}
	);
	if (response.body) {
		const reader = response.body.getReader();
		console.log(reader);
		let result = "";
		let isResultEnd = false;
		let fullValue = new Uint8Array(0);

		while (true) {
			const {done, value} = await reader.read();
			if (done) {
				const chunk = new TextDecoder("utf-8").decode(fullValue);
				updateChatSome(+uuid, index, {
					loading: false,
				});
				const jsonRes = chunk.split("Ж")[1];
				if (isJsonString(jsonRes)) {
					handleChatBotResponce(
						JSON.parse(jsonRes),
						sessionId,
						message,
						options,
						checkpoints,
						index,
						result
					);
				} else {
					// 流式中断
				}
				break;
			}
			// 将每次接受到的数据拼接成一个数组
			var tmpArr = new Uint8Array(fullValue.length + value.length);
			tmpArr.set(fullValue);
			tmpArr.set(value, fullValue.length);
			fullValue = tmpArr;

			// 解析字符
			const chunk = new TextDecoder("utf-8").decode(value);
			console.log(chunk);
			if (!isResultEnd) {
				if (chunk.indexOf("Ж") === -1) {
					result += chunk;
				} else {
					result += chunk.split("Ж")[0];
					isResultEnd = true;
				}
			}


			updateChat(+uuid, !index ? dataSources.value.length - 1 : index, {
				dateTime: new Date().toLocaleString(),
				text: result,
				inversion: false,
				error: false,
				loading: false,
				conversationOptions: {
					conversationId: "conversationId",
					parentMessageId: "parentMessageId", // 上条消息id 后端没有
				},
				requestOptions: {prompt: message, options: {...options}},
			});
			scrollToBottomIfAtBottom();
		}
		if (interviewing){
			qList.value.push(result)
		}
	}
};

function get_wav_bytes(dataBytes: any) {
	// 找到长度结束符的位置
	const lenEnd = dataBytes.indexOf(13); // \r
	const lenEnd2 = dataBytes.indexOf(10); // \n

	// 解析长度
	const lenBytes = dataBytes.subarray(0, lenEnd);
	const dataLength = parseInt(new TextDecoder().decode(lenBytes), 16);

	if (dataLength == 0) {
		return null;
	}
	// 提取wav数据
	const wavBytes = dataBytes.subarray(lenEnd2 + 1, dataLength + 1);
	return wavBytes;
}

// 机器人语音播报
const chatBotAudio = async (message: any, sessionId: any, index: any) => {
	const {audioElement, mediaSource, receiveAudioData} = useStreamAudio();
	const {id: instanceId, token} = instanceInfo.value;

	// 播放结束关闭loading状态
	audioElement.addEventListener("ended", function () {
		console.log("音频播放结束");
		updateChatSome(+uuid, index, {
			text: "播报结束",
			loading: false,
		});
	});
	const response = await fetch(
		// `/sqacp/questionAnswering/chatBotStrategyStreamingExecutor?instanceId=${instanceId}&sessionId=${sessionId}&token=${token}&usingAudio=true`,
		// "localhost.73:10016/tts",
		"localhost.250:11116/tts",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			signal: controller.signal,
			body: JSON.stringify({text: message}),
		}
	);

	if (response.body) {
		const reader = response.body.getReader();
		// let fullValue = new Uint8Array(0);
		while (true) {
			const {done, value} = await reader.read();
			if (done) {
				// await receiveAudioData(fullValue.buffer)
				mediaSource.endOfStream();
				break;
			}

			const binaryData = get_wav_bytes(new Uint8Array(value));
			console.log(binaryData);
			if (binaryData) {
				await receiveAudioData(binaryData.buffer);
			}
		}
	}
};


const handleRecordStop = () => {
	stopRecord((blob: any, duration: any) => {
		console.log(blob);

		const fileReader = new FileReader();
		fileReader.onload = function (evt) {
			var result = evt.target?.result;
			console.log(result);
			addChat(+uuid, {
				dateTime: new Date().toLocaleString(),
				text: result,
				// text: (window.URL || webkitURL).createObjectURL(blob),
				type: "audio",
				duration: duration,
				inversion: true,
				error: false,
				conversationOptions: null,
				requestOptions: {prompt: "", options: null},
			});
		};
		fileReader.readAsDataURL(blob);
		scrollToBottom();
	});
};

// 语音播放
const playAudio = (
	index: number,
	base64: any,
	isPlaying: boolean | undefined
) => {
	if (isPlaying) {
		updateChatSome(+uuid, index, {
			playing: false,
		});
		audio.pause();
	} else {
		base64ToBlob({b64data: base64, contentType: "audio/mp3"}).then(
			(res: any) => {
				audio.src = (window.URL || webkitURL).createObjectURL(res);
				audio.play();
				updateChatSome(+uuid, index, {
					playing: true,
				});
			}
		);
	}
};

async function onConversationWithPromptInjection(injection:string) {
	let message = prompt.value;
	console.log("input prompt:  ",message);
	if (loading.value) return;

	if (!message || message.trim() === "") return;

	controller = new AbortController();

	addChat(+uuid, {
		dateTime: new Date().toLocaleString(),
		text: message,
		inversion: true,
		error: false,
		conversationOptions: null,
		requestOptions: {prompt: message, options: null},
	});
	scrollToBottom();

	loading.value = true;
	console.log("done");
	prompt.value = "";

	let options: Chat.ConversationRequest = {};
	const lastContext =
		conversationList.value[conversationList.value.length - 1]
			?.conversationOptions;

	if (lastContext && usingContext.value) options = {...lastContext};

	addChat(+uuid, {
		dateTime: new Date().toLocaleString(),
		text: "",
		loading: true,
		// type: instanceInfo.value.usingLLM && usingAudio.value ? "audio" : "",
		inversion: false,
		error: false,
		conversationOptions: null,
		requestOptions: {prompt: message, options: {...options}},
	});
	scrollToBottom();
	handleChat(injection, options, dataSources.value.length - 1);
}
async function onConversation() {
	let message = prompt.value;
	console.log(message);
	if (loading.value) return;

	if (!message || message.trim() === "") return;

	controller = new AbortController();

	addChat(+uuid, {
		dateTime: new Date().toLocaleString(),
		text: message,
		inversion: true,
		error: false,
		conversationOptions: null,
		requestOptions: {prompt: message, options: null},
	});
	scrollToBottom();

	loading.value = true;
	console.log("done");
	prompt.value = "";

	let options: Chat.ConversationRequest = {};
	const lastContext =
		conversationList.value[conversationList.value.length - 1]
			?.conversationOptions;

	if (lastContext && usingContext.value) options = {...lastContext};

	addChat(+uuid, {
		dateTime: new Date().toLocaleString(),
		text: "",
		loading: true,
		// type: instanceInfo.value.usingLLM && usingAudio.value ? "audio" : "",
		inversion: false,
		error: false,
		conversationOptions: null,
		requestOptions: {prompt: message, options: {...options}},
	});
	scrollToBottom();
	handleChat(message, options, dataSources.value.length - 1);
}

async function onRegenerate(index: number) {
	if (loading.value) return;

	controller = new AbortController();

	const {requestOptions} = dataSources.value[index];

	let message = requestOptions?.prompt ?? "";

	let options: Chat.ConversationRequest = {};

	if (requestOptions.options) options = {...requestOptions.options};

	loading.value = true;

	updateChat(+uuid, index, {
		dateTime: new Date().toLocaleString(),
		text: "",
		inversion: false,
		error: false,
		loading: true,
		// type: instanceInfo.value.usingLLM && usingAudio.value ? "audio" : "",
		conversationOptions: null,
		requestOptions: {prompt: message, options: {...options}},
	});
	handleChat(message, options, index);
}

async function handleChat(message: any, options: any, index?: any) {
	try {
		if (instanceInfo.value && instanceInfo.value.id != 0) {
			if (instanceInfo.value.usingLLM) {
				if (usingAudio.value) {
					await chatBotAudio(message, uuidv4(), index);
				} else {
					await chatBotStrategyStreamingExecutor(
						message,
						options,
						uuidv4(),
						undefined,
						index
					);
				}
			} else {
				await chatBotStrategyExecutor(
					message,
					options,
					uuidv4(),
					undefined,
					index
				);
			}
		} else {
			await streamChat(message, options, index);
		}
	} catch (error: any) {
		console.log(error);
		// const errorMessage = error?.message ?? t("common.wrong");
		console.log(error.message);
		const currentChat = getChatByUuidAndIndex(+uuid, index);
		if (
			error
		) {
			updateChatSome(+uuid, index, {
				text: `${currentChat?.text}\n[回答终止]`,
				error: false,
				loading: false,
			});
			scrollToBottomIfAtBottom();
			return;
		}

		const errorMessage = t("common.wrong");
		updateChat(+uuid, index, {
			dateTime: new Date().toLocaleString(),
			text: errorMessage,
			inversion: false,
			error: true,
			loading: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		});
		scrollToBottomIfAtBottom();
	} finally {
		loading.value = false;
	}
}

function handleExport() {
	if (loading.value) return;

	const d = dialog.warning({
		title: t("chat.exportImage"),
		content: t("chat.exportImageConfirm"),
		positiveText: t("common.yes"),
		negativeText: t("common.no"),
		onPositiveClick: async () => {
			try {
				d.loading = true;
				const ele = document.getElementById("image-wrapper");
				const canvas = await html2canvas(ele as HTMLDivElement, {
					useCORS: true,
				});
				const imgUrl = canvas.toDataURL("image/png");
				const tempLink = document.createElement("a");
				tempLink.style.display = "none";
				tempLink.href = imgUrl;
				tempLink.setAttribute("download", "chat-shot.png");
				if (typeof tempLink.download === "undefined")
					tempLink.setAttribute("target", "_blank");

				document.body.appendChild(tempLink);
				tempLink.click();
				document.body.removeChild(tempLink);
				window.URL.revokeObjectURL(imgUrl);
				d.loading = false;
				ms.success(t("chat.exportSuccess"));
				Promise.resolve();
			} catch (error: any) {
				ms.error(t("chat.exportFailed"));
			} finally {
				d.loading = false;
			}
		},
	});
}

function handleDelete(index: number) {
	if (loading.value) return;

	dialog.warning({
		title: t("chat.deleteMessage"),
		content: t("chat.deleteMessageConfirm"),
		positiveText: t("common.yes"),
		negativeText: t("common.no"),
		onPositiveClick: () => {
			chatStore.deleteChatByUuid(+uuid, index);
		},
	});
}

async function handleThumbUp(index: number, item: any) {
	if (loading.value) return;
	console.log(item);
	const logList = [
		{
			sessionType: item.type === "richtext" ? "ANS_UPVOTE" : "REC_UPVOTE",
		},
	];
	await saveSessionLog(item.sessionId, logList);
	updateChatSome(+uuid, index, {
		feedback: 1, // 1 赞 2 踩
	});
}

async function handleThumbDown(index: number, item: any) {
	if (loading.value) return;
	console.log(item);
	const logList = [
		{
			sessionType: item.type === "richtext" ? "ANS_DOWNVOTE" : "REC_DOWNVOTE",
		},
	];
	await saveSessionLog(item.sessionId, logList);
	updateChatSome(+uuid, index, {
		feedback: 2,
	});
	showModal.value = true;
	sessionId.value = item.sessionId; // 保存点踩消息的sessionId
}

function handleClear() {
	if (loading.value) return;

	dialog.warning({
		title: t("chat.clearChat"),
		content: t("chat.clearChatConfirm"),
		positiveText: t("common.yes"),
		negativeText: t("common.no"),
		onPositiveClick: () => {
			chatStore.clearChatByUuid(+uuid);
		},
	});
}

function handleEnter(event: KeyboardEvent) {
	if (!isMobile.value) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	} else {
		if (event.key === "Enter" && event.ctrlKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
}

function handleStop() {
	if (loading.value) {
		controller.abort();
		loading.value = false;
	}
}

function handlePrefill() {
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
	if (prompt.value.startsWith("/")) {
		return promptTemplate.value
			.filter((item: { key: string }) =>
				item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())
			)
			.map((obj: { value: any }) => {
				return {
					label: obj.value,
					value: obj.value,
				};
			});
	} else {
		return [];
	}
});

// value反渲染key
const renderOption = (option: { label: string }) => {
	for (const i of promptTemplate.value) {
		if (i.value === option.label) return [i.key];
	}
	return [];
};

const placeholder = computed(() => {
	if (isMobile.value) return t("chat.placeholderMobile");
	return t("chat.placeholder");
});

const buttonDisabled = computed(() => {
	return loading.value || !prompt.value || prompt.value.trim() === "";
});

const footerClass = computed(() => {
	let classes = ["p-4"];
	if (isMobile.value)
		classes = [
			"sticky",
			"left-0",
			"bottom-0",
			"right-0",
			"p-2",
			"pr-3",
			"overflow-hidden",
		];
	return classes;
});

// 答案篇章依据
const showSentenceInfo = (index: number) => {
	const currentChat = getChatByUuidAndIndex(+uuid, index);
	const sentenceInfo = currentChat?.sentenceInfo;
	sentenceInfo.show = !sentenceInfo.show;
	updateChatSome(+uuid, index, {
		sentenceInfo,
	});
};
// 多轮提交完成
const finishSubmit = (index: number) => {
	updateChatSome(+uuid, index, {submited: true});
};


onMounted(() => {
	// afterImageLoad();
	scrollToBottom();
	if (inputRef.value && !isMobile.value) inputRef.value?.focus();
	if (!conversationList.value.length){
		if (cvString.value){
			let message=evaluationPrompt+"简历内容如下："+cvString.value+"(end)";
			let options: Chat.ConversationRequest = {};
			console.log(message)
			handleChat(message, options, dataSources.value.length - 1)
		}
	}

});

onUnmounted(() => {
	if (loading.value) controller.abort();
});
</script>

<template>
	<div class="flex flex-col w-full h-full">
		<HeaderComponent
			v-if="isMobile && !isLogMode"
			:using-context="usingContext"
			:using-audio="usingAudio"
			@export="handleExport"
			@toggle-using-context="toggleUsingContext"
			@toggle-using-audio="toggleUsingAudio"
		/>
		<main class="flex-1 overflow-hidden">
			<div
				id="scrollRef"
				ref="scrollRef"
				class="h-full overflow-hidden overflow-y-auto"
			>
				<div
					id="image-wrapper"
					class="w-full h-full max-w-screen-xl m-auto dark:bg-[#101014]"
					:class="[isMobile ? 'p-2' : 'p-4']"
				>
					<template v-if="instanceInfo.instanceType !== 'PreFill'">
						<template v-if="!dataSources.length">
							<div
								class="flex items-center justify-center mt-4 text-center text-neutral-300"
							>
								<SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl"/>
								<span>Aha~</span>
							</div>
						</template>
						<template v-else>
							<div>
								<Message
									v-for="(item, index) of dataSources"
									:key="index"
									:date-time="item.dateTime"
									:text="item.text"
									:duration="item.duration"
									:playing="item.playing"
									:inversion="item.inversion"
									:error="item.error"
									:loading="item.loading"
									:commentable="item.commentable"
									:type="item.type"
									:feedback="item.feedback"
									:requestOptions="item.requestOptions"
									:sentenceInfo="item.sentenceInfo"
									:submited="item.submited"
									:isLogMode="isLogMode"
									@regenerate="onRegenerate(index)"
									@delete="handleDelete(index)"
									@thumbUp="handleThumbUp(index, item)"
									@thumbDown="handleThumbDown(index, item)"
									@scrollToBottom="scrollToBottom"
									@chatBotStrategyExecutor="
                    chatBotStrategyExecutor(
                      item.question,
                      item.requestOptions.options,
                      item.sessionId,
                      item.text,
                      -1
                    )
                  "
									@showSentenceInfo="showSentenceInfo(index)"
									@finishSubmit="finishSubmit(index)"
									@play-audio="playAudio(index, item, item.playing)"
								/>
								<div class="sticky bottom-0 left-0 flex justify-center">
									<NButton v-if="loading" type="warning" @click="handleStop">
										<template #icon>
											<SvgIcon icon="ri:stop-circle-line"/>
										</template>
										Stop Responding
									</NButton>
								</div>
							</div>
						</template>
					</template>
					<template v-else>
						<Prefill :formUrl="instanceInfo.formUrl"></Prefill>
					</template>
				</div>
			</div>
		</main>
		<footer :class="footerClass" v-if="!isLogMode">
			<div class="w-full max-w-screen-xl m-auto">
				<div
					class="flex items-center justify-between space-x-2"
					v-if="instanceInfo.instanceType !== 'PreFill'"
				>
					<HoverButton @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line"/>
            </span>
					</HoverButton>

					<HoverButton v-if="!isMobile" @click="toggleUsingContext">
            <span
							class="text-xl"
							:class="{
                'text-[#1890ff]': usingContext,
                'text-[#a8071a]': !usingContext,
              }"
						>
              <SvgIcon icon="ri:chat-history-line"/>
            </span>
					</HoverButton>

					<NAutoComplete
						v-model:value="prompt"
						:options="searchOptions"
						:render-label="renderOption"
					>
						<template #default="{ handleInput, handleBlur, handleFocus }">
							<div class="w-full">
								<div
									v-if="isRecording"
									id="recwave"
									class="w-full h-10 text-center"
								></div>
								<NInput
									v-else
									ref="inputRef"
									v-model:value="prompt"
									type="textarea"
									:placeholder="placeholder"
									:autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
									@input="handleInput"
									@focus="handleFocus"
									@blur="handleBlur"
									@keypress="handleEnter"
								>
								</NInput>
							</div>
						</template>
					</NAutoComplete>
					<NButton
						type="primary"
						:disabled="buttonDisabled && !isRecording"
						@click="
              () => {
                !isRecording ? handleSubmit() : handleRecordStop();
              }
            "
					>
						<template #icon>
              <span class="dark:text-black" v-if="!isRecording">
                <SvgIcon icon="ri:send-plane-fill"/>
              </span>
							<span v-else class="text-xl cursor-pointer">
                <SvgIcon icon="ri:stop-circle-line"/>
              </span>
						</template>
					</NButton>
				</div>
				<div class="flex justify-center space-x-2" v-else>
					<NButton type="primary" @click="handlePrefill"> 开始预填</NButton>
				</div>
			</div>
		</footer>
		<!-- 投诉反馈 -->
		<Complain
			:showModal="showModal"
			@handleCancel="
        () => {
          showModal = false;
        }
      "
			:instanceId="instanceInfo.id"
			:sessionId="sessionId"
			@saveSessionLog="
        () => {
          saveSessionLog(sessionId, [
            {
              sessionType: 'REPORT',
            },
          ]);
        }
      "
		></Complain>
	</div>
</template>
