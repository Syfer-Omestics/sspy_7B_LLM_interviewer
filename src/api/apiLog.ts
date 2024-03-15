
import customRequest from "./request";
const request = customRequest({
	baseURL: import.meta.env.VITE_GLOB_APILOG_URL,
});
const apiLog: any = {};
//chatBotInstanceInitController/getPageableChatBotInstance
apiLog.handleHardQuestions = (data: any) => {
	return request({
		url: "/questionAnalysis/handleHardQuestions",
		method: "post",
		data: data,
	});
};
// logManagement/saveSessionLog 保存单条会话
apiLog.saveSessionLog = (params: any, data: any) => {
	return request({
		url: "/logManagement/saveSessionLog",
		method: "post",
		params,
		data: data,
	});
};

// feedbackProcess/handleAnswerResponse
apiLog.handleAnswerResponse = (data: any) => {
	return request({
		url: "/feedbackProcess/handleAnswerResponse",
		method: "post",
		data: data,
	});
};

// logManagement/getSessionLogs 根据chatId获取会话日志列表（已根据时间排序）
apiLog.getSessionLogs = (params: any) => {
	return request({
		url: "/logManagement/getSessionLogs",
		method: "get",
		params,
	});
};
export default apiLog;
