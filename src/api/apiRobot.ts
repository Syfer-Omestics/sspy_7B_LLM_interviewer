
import customRequest from "./request";
const request = customRequest({
	baseURL: import.meta.env.VITE_GLOB_APIROBOT_URL,
});
const apiRobot: any = {};
//chatBotInstanceInitController/getPageableChatBotInstance
apiRobot.getPageableChatBotInstance = (params: any) => {
	return request({
		url: "/chatBotInstanceInitController/getPageableChatBotInstance",
		method: "get",
		params,
	});
};
// questionAnswering/chatBotStrategyExecutor
apiRobot.chatBotStrategyExecutor = (params: any, data: any, signal: any) => {
	return request({
		url: "/questionAnswering/chatBotStrategyExecutor",
		method: "post",
		params,
		data: data,
		signal: signal,
	});
};
//chatBotInstanceConfigController​/getTokenWithChatBotInstanceId  根据机器人实例id查询Token
apiRobot.getTokenWithChatBotInstanceId = (params: any) => {
	return request({
		url: "/chatBotInstanceConfigController/getTokenWithChatBotInstanceId",
		method: "get",
		params,
	});
};

//chatBotPrefillManageController/getPreFillInstanceBaseAndStrategyParams  根据机器人实例id预填策略
apiRobot.getPreFillInstanceBaseAndStrategyParams = (params: any) => {
	return request({
		url: "/chatBotPrefillManageController/getPreFillInstanceBaseAndStrategyParams",
		method: "get",
		params,
	});
};

// chatBotRetrievalManageController/findChatBotRetrievalStrategy  根据机器人实例id篇章学习策略
apiRobot.findChatBotRetrievalStrategy = (params: any) => {
	return request({
		url: "/chatBotRetrievalManageController/findChatBotRetrievalStrategy",
		method: "get",
		params,
	});
};

// /questionAnswering/findPageChatBotChapterCorpusDocs 已学习篇章
apiRobot.findPageChatBotChapterCorpusDocs = (params: any) => {
	return request({
		url: "/questionAnswering/findPageChatBotChapterCorpusDocs",
		method: "get",
		params,
	});
};

//  chatBotRetrievalManageController​/ findPageChatBotParagraphCorpusDocs 查询指定篇章的所有段落
apiRobot.findPageChatBotParagraphCorpusDocs = (params: any) => {
	return request({
		url: "/chatBotRetrievalManageController/findPageChatBotParagraphCorpusDocs",
		method: "get",
		params,
	});
};
//  chatBotRetrievalManageController​/ findPageChatBotParagraphCorpusDocs 查询指定篇章的所有段落BYrowKey
apiRobot.findPageChatBotParagraphCorpusDocsByChapterRowKey = (params: any) => {
	return request({
		url: "/chatBotRetrievalManageController/findPageChatBotParagraphCorpusDocsByChapterRowKey",
		method: "get",
		params,
	});
};



// chatBotRetrievalManageController​/findPictureUrlByParagraphRowKey 根据段落RowKey查询其关联的所有图片地址
apiRobot.findPictureUrlByParagraphRowKey = (params: any) => {
	return request({
		url: "/chatBotRetrievalManageController/findPictureUrlByParagraphRowKey",
		method: "post",
		params,
	});
};

// chatBotRetrievalManageController/findChatBotParagraphDocsByParagraphRowKey 查询指定篇章的指定段落
apiRobot.findChatBotParagraphDocsByParagraphRowKey = (params: any) => {
	return request({
		url: "/chatBotRetrievalManageController/findChatBotParagraphDocsByParagraphRowKey",
		method: "get",
		params,
	});
};



export default apiRobot;
