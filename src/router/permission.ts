
import apiRobot from "@/api/apiRobot";
import { useAuthStoreWithout } from "@/store/modules/auth";
import { useChatStore } from "@/store/modules/chat";
import type { Router } from "vue-router";

// 路由守卫逻辑
export function setupPageGuard(router: Router) {
	router.beforeEach(async (to, from, next) => {
		const authStore = useAuthStoreWithout();
		const chatStore = useChatStore();
		async function handleAdd(
			instanceId: any,
			instanceName: any,
			instanceType: any,
			usingLLM: boolean,
			relatedChapterInstance: any,
      strategyType:string
		) {
			const instanceInfo: any = {
				id: instanceId,
				instanceName,
				instanceType,
				usingLLM,
				relatedChapterInstance,
        strategyType
			};
			const res = await apiRobot.getTokenWithChatBotInstanceId({ instanceId });

			if (instanceType === "PreFill") {
				const res2 = await apiRobot.getPreFillInstanceBaseAndStrategyParams({
					instanceId,
				});
				instanceInfo.formUrl = res2.data.preFillInstanceBaseParamsVO.formUrl;
			} else if (instanceType === "Search") {
				const res2 = await apiRobot.findChatBotRetrievalStrategy({
					instanceId,
				});
				instanceInfo.knowledgeLearnType = res2.data.knowledgeLearnType;
			}
			instanceInfo.token = res.data;
			chatStore.addHistory({
				title: instanceInfo.instanceName,
				uuid: Date.now(),
				isEdit: false,
				instanceInfo,
			});
			// if (isMobile.value) appStore.setSiderCollapsed(true);
		}
		const { token } = to.query as { token: string };
		const { uuid } = to.params as { uuid: string };
		const {
			instanceId,
			instanceName,
			instanceType,
			usingLLM,
			relatedChapterInstance,
      strategyType
		} = to.query as {
			instanceId: string;
			instanceName: string;
			instanceType: string;
			usingLLM: string;
			relatedChapterInstance: string;
      strategyType:string;
		};
		if (token) {
			authStore.setToken(token);
		}
		if (instanceId && uuid != "log") {
			const history = chatStore.getHistory;
			console.log(history);
			const target = history.find((h) => h.instanceInfo.id == instanceId);
			if (target) {
				chatStore.setActive(target.uuid);
			} else {
				handleAdd(
					instanceId,
					instanceName,
					instanceType,
					usingLLM === "true",
					relatedChapterInstance === "null" ? null : relatedChapterInstance,
          strategyType
				);
			}
		}
		if (!authStore.auth) {
			try {
				const data = await authStore.checkToken(authStore.token);
				console.log(data);
				if (data) {
					if (to.path === "/500") next({ name: "Root" });
					else next();
				} else {
					next({ name: "500" });
				}
			} catch (error) {
				if (to.path !== "/500") next({ name: "500" });
				else next();
			}
		} else {
			next();
		}
	});
}
