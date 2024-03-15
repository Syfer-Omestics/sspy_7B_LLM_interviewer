export function useStreamAudio() {	
  // 创建音频上下文
	const audioContext = new AudioContext();
	// 创建MediaSource对象
	const mediaSource = new MediaSource();

	// 创建SourceBuffer对象
	let sourceBuffer: any = null;
	// 创建音频元素
	const audioElement = new Audio();
	audioElement.src = URL.createObjectURL(mediaSource);
	// 连接音频元素和音频上下文
	const source = audioContext.createMediaElementSource(audioElement);
	source.connect(audioContext.destination);
	// 播放结束关闭loading状态
	// audioElement.addEventListener("ended", function () {
	//   console.log("音频播放结束");
	//   updateChatSome(+uuid, index, {
	//     text: "播报结束",
	//     loading: false,
	//   });
	// });
	// 监听MediaSource的sourceopen事件
	mediaSource.addEventListener("sourceopen", async () => {
		// 创建SourceBuffer对象
		sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
		let isPlaying = false;
		// 监听sourceBuffer的updateend事件
		sourceBuffer.addEventListener("updateend", () => {
			// 如果sourceBuffer中有数据，则开始播放音频
			console.log(sourceBuffer.updating, mediaSource.readyState);
			if (
				!sourceBuffer.updating &&
				mediaSource.readyState === "open" &&
				!isPlaying
			) {
				// mediaSource.endOfStream();
				console.log("play");
				audioElement.play();
				isPlaying = true;
			}
		});
	});
	// 接收音频数据并追加到sourceBuffer
	function receiveAudioData(audioData: any) {
		return new Promise((resolve) => {
			sourceBuffer.addEventListener("updateend", () => resolve(true));
			sourceBuffer.appendBuffer(audioData);
		});
	}

	return {
		receiveAudioData,
		audioElement,
    mediaSource
	};
}
