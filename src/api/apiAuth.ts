
import customRequest from "./request";
const request: any = customRequest({
	baseURL: import.meta.env.VITE_GLOB_APIAUTH_URL,
});
const apiAuth: any = {};

// 鉴权
apiAuth.checkToken = (params: any) => {
	return request({
		url: "/oauth/check_token",
		method: "POST",
		params,
	});
};

// 查询appKey
apiAuth.queryAppKey = () => {
	return request({
		url: "/query/token",
		method: "GET",
		auth: true,
	});
};

// 获取appKey
apiAuth.getAppKey = () => {
	return request({
		url: "/access/token",
		method: "GET",
		auth: true,
	});
};

// 更新appKey
apiAuth.refreshAppKey = () => {
	return request({
		url: "/refresh/token",
		method: "GET",
		auth: true,
	});
};

// 删除appKey
apiAuth.deleteAppKey = () => {
	return request({
		url: "/delete/token",
		method: "DELETE",
		auth: true,
	});
};
export default apiAuth;
