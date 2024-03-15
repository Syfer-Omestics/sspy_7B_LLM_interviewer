
<script lang="ts" setup>
import { computed, nextTick } from "vue";
import { HoverButton, SvgIcon } from "@/components/common";
import { useAppStore, useChatStore } from "@/store";

interface Props {
	formUrl: string;
}

interface Emit {
	(ev: "export"): void;
	(ev: "toggleUsingContext"): void;
}

defineProps<Props>();

const emit = defineEmits<Emit>();

const appStore = useAppStore();
const chatStore = useChatStore();

const collapsed = computed(() => appStore.siderCollapsed);

function toggleUsingContext() {
	emit("toggleUsingContext");
}
</script>

<template>
	<div className="text-center w-full h-full">
		<iframe
			name="chatBot"
			:src="formUrl"
			style="width: 100%; height: 100%; border: none"
		></iframe>
	</div>
</template>
