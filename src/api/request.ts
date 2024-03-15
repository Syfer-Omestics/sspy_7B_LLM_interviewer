import { ss } from "@/utils/storage";
import axios, { CreateAxiosDefaults } from "axios";

const handleNetworkError = (err: {
	code: string;
	response: { status: any };
	request: { responseType: string; response: Blob; responseText: any };
}) => {
	const errStatus = err.response?.status;
	console.log(err);
	let errMessage;
	if (errStatus) {
		switch (errStatus) {
			case 400:
				errMessage = "错误的请求";
				break;
			case 401:
				errMessage = "未授权，请重新登录";
				break;
			case 403:
				errMessage = "拒绝访问";
				break;
			case 404:
				errMessage = "请求错误,未找到该资源";
				break;
			case 405:
				errMessage = "请求方法未允许";
				break;
			case 408:
				errMessage = "请求超时";
				break;
			case 500:
				errMessage = "服务器端出错";
				break;
			case 501:
				errMessage = "网络未实现";
				break;
			case 502:
				errMessage = "网络错误";
				break;
			case 503:
				errMessage = "服务不可用";
				break;
			case 504:
				errMessage = "网关超时";
				break;
			case 505:
				errMessage = "http版本不支持该请求";
				break;
			default:
				errMessage = `其他连接错误 --${errStatus}`;
		}
	} else {
		errMessage = `无法连接到服务器！`;
	}

	// 取消请求
	if (err.code === "ERR_CANCELED") {
		return;
	}

	// let description;
	// 下载文件失败时，接口返回了json格式数据
	if (err.request.responseType === "blob") {
		const reader: any = new FileReader();
		reader.readAsText(err.request.response, "utf-8");
		reader.onload = function () {
			// let errorMsg = JSON.parse(reader.result);
			// description = errorMsg.msg;
			window.$message?.error("下载失败");
		};
	} else {
		// description = err.request?.responseText;
		window.$message?.error(errMessage);
	}
};

export default function request(config: CreateAxiosDefaults<any> | undefined) {
	const instance = axios.create({
		timeout: 30000,
		...config,
	});

	instance.interceptors.request.use(
		(config) => {
			if (config.auth) {
				const token = ss.get("access_token");
				config.headers.Authorization = `Bearer ${token}` || "";
				delete config.auth;
			}
			return config;
		},
		(err) => {
			return Promise.reject(err);
		}
	);
	instance.interceptors.response.use(
		(res) => {
			// if (res.status !== 200) return Promise.reject(res.data);
			if (res.data.code === 401) {
				window.$message?.error("未授权，请重新登录");
			} else {
				return res.data;
			}
		},
		(err) => {
			handleNetworkError(err);
			return Promise.reject(err);
		}
	);

	return instance;
}
