
import type { Ref } from "vue";
import { nextTick, ref } from "vue";

type ScrollElement = HTMLDivElement | null;

interface ScrollReturn {
	scrollRef: Ref<ScrollElement>;
	scrollToBottom: () => Promise<void>;
	scrollToTop: () => Promise<void>;
	scrollToBottomIfAtBottom: () => Promise<void>;
	scrollToPosition: (height: number) => Promise<void>;
}

export function useScroll(): ScrollReturn {
	const scrollRef = ref<ScrollElement>(null);

	const scrollToBottom = async () => {
		await nextTick();
		// setTimeout(() => {
			if (scrollRef.value)
				scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
		// }, 300);
	};

	const scrollToTop = async () => {
		await nextTick();
		if (scrollRef.value) scrollRef.value.scrollTop = 0;
	};

	const scrollToBottomIfAtBottom = async () => {
		await nextTick();
		if (scrollRef.value) {
			const threshold = 100; // 阈值，表示滚动条到底部的距离阈值
			const distanceToBottom =
				scrollRef.value.scrollHeight -
				scrollRef.value.scrollTop -
				scrollRef.value.clientHeight;
			if (distanceToBottom <= threshold)
				scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
		}
	};

	const scrollToPosition = async (height: number) => {
		console.log(height);

		await nextTick();
		console.log(scrollRef.value);

		if (scrollRef.value) scrollRef.value.scrollTop = 200;
	};
	return {
		scrollRef,
		scrollToBottom,
		scrollToTop,
		scrollToBottomIfAtBottom,
		scrollToPosition,
	};
}
