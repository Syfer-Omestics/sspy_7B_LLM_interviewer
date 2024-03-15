// import Recorder from "js-audio-recorder";
import Recorder from "recorder-core";
import "recorder-core/src/engine/mp3";
import "recorder-core/src/engine/mp3-engine"; //如果此格式有额外的编码引擎（*-engine.js）的话，必须要加上
import "recorder-core/src/extensions/frequency.histogram.view.js";
import "recorder-core/src/extensions/lib.fft.js";

import { nextTick, ref } from "vue";
export function useRecorder() {
	const recorder = ref<any>(null);
	const wave = ref<any>(null);
	const isRecording = ref<boolean>(false);
	const mp3Blob = ref<any>(null);

	const initRecorder = () => {
		recorder.value = Recorder({
			//本配置参数请参考下面的文档，有详细介绍
			type: "mp3",
			sampleRate: 16000,
			bitRate: 16, //mp3格式，指定采样率hz、比特率kbps，其他参数使用默认配置；注意：是数字的参数必须提供数字，不要用字符串；需要使用的type类型，需提前把格式支持文件加载进来，比如使用wav格式需要提前加载wav.js编码引擎
			onProcess: function (
				buffers,
				powerLevel,
				bufferDuration,
				bufferSampleRate,
				newBufferIdx,
				asyncEnd
			) {
				//录音实时回调，大约1秒调用12次本回调，buffers为开始到现在的所有录音pcm数据块(16位小端LE)
				//可利用extensions/sonic.js插件实时变速变调，此插件计算量巨大，onProcess需要返回true开启异步模式
				//可实时上传（发送）数据，配合Recorder.SampleData方法，将buffers中的新数据连续的转换成pcm上传，或使用mock方法将新数据连续的转码成其他格式上传，可以参考文档里面的：Demo片段列表 -> 实时转码并上传-通用版；基于本功能可以做到：实时转发数据、实时保存数据、实时语音识别（ASR）等

				//可实时绘制波形（extensions目录内的waveview.js、wavesurfer.view.js、frequency.histogram.view.js插件功能）
				wave.value &&
					wave.value.input(
						buffers[buffers.length - 1],
						powerLevel,
						bufferSampleRate
					);
			},
		});
		recorder.value.open(
			async function () {
				isRecording.value = true;
				await nextTick(); // 等wave容器渲染
				//打开麦克风授权获得相关资源
				//rec.start() 此处可以立即开始录音，但不建议这样编写，因为open是一个延迟漫长的操作，通过两次用户操作来分别调用open和start是推荐的最佳流程
				//创建可视化，指定一个要显示的div
				if (Recorder.FrequencyHistogramView)
					wave.value = Recorder.FrequencyHistogramView({
						elem: "#recwave",
						lineCount: 120,
						position: 0,
						minHeight: 1,
						stripeEnable: false,
						linear: [0, "#1890ff", 1, "#1890ff"],
					});
				recorder.value.start();
			},
			function (msg: any, isUserNotAllow: any) {
				//用户拒绝未授权或不支持
				console.log(
					(isUserNotAllow ? "UserNotAllow，" : "") + "无法录音:" + msg
				);
			}
		);
	};

	// initRecorder()
	const startRecord = () => {
		isRecording.value = true;
		recorder.value.start();
	};

	const stopRecord = (handleBlob: Function): any => {
		recorder.value.stop(
			(blob: any, duration: any) => {
				recorder.value.close(); //可以通过stop方法的第3个参数来自动调用close
				recorder.value = null;
				isRecording.value = false;
        handleBlob(blob,duration)
        // 上传
				const file = new File([blob], "audio", { type: blob.type });
				const formData = new FormData();
				formData.append("upload_file", file, "audio");
				fetch("localhost.250:10017/asr", {
					method: "POST",
					// headers: {
					// 	"Content-Type": "multipart/form-data;",
					// },
					body: formData,
					redirect: "follow",
				});
			},
			(msg: any) => {
				console.log("录音失败:" + msg);
				recorder.value.close(); //可以通过stop方法的第3个参数来自动调用close
				recorder.value = null;
				isRecording.value = false;
			}
		);
	};

	return {
		initRecorder,
		startRecord,
		stopRecord,
		recorder,
		isRecording,
		mp3Blob,
	};
}
