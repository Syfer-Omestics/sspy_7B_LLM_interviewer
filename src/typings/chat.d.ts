declare namespace Chat {
	interface Chat {
		dateTime: string;
		text: any; // 包括消息/列表/富文本/表单/语音
		type?: string;
    duration?:number;
    playing?:boolean;
		commentable?: boolean; // 可否评论
		sessionId?: string;
		question?: string;
		inversion?: boolean;
		error?: boolean;
		loading?: boolean;
		feedback?: number;
		sentenceInfo?: any; // 答案依据
    submited?:boolean;// 完成提交
		conversationOptions?: ConversationRequest | null;
		requestOptions: { prompt: string; options?: ConversationRequest | null };
	}

	interface History {
		title: string;
		isEdit: boolean;
		uuid: number;
		instanceInfo: any;
		checkedChapters?: any;
		resumeType: any
	}

	interface ChatState {
		active: number | null;
		usingContext: boolean;
    usingAudio:boolean;
		history: History[];
		chat: { uuid: number; data: Chat[] }[];
	}

	interface ConversationRequest {
		conversationId?: string;
		parentMessageId?: string;
		history?: any;
	}

	interface ConversationResponse {
		conversationId: string;
		detail: {
			choices: {
				finish_reason: string;
				index: number;
				logprobs: any;
				text: string;
			}[];
			created: number;
			id: string;
			model: string;
			object: string;
			usage: {
				completion_tokens: number;
				prompt_tokens: number;
				total_tokens: number;
			};
		};
		id: string;
		parentMessageId: string;
		role: string;
		text: string;
	}
}
