import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { t } from '@/locales'
import { useChatStore } from '@/store'

export function useUsingAudio() {
  const ms = useMessage()
  const chatStore = useChatStore()
  const usingAudio = computed<boolean>(() => chatStore.usingAudio)

  function toggleUsingAudio() {
    chatStore.setUsingAudio(!usingAudio.value)
    if (usingAudio.value)
      ms.success(t('chat.turnOnAudio'))
    else
      ms.warning(t('chat.turnOffAudio'))
  }

  return {
    usingAudio,
    toggleUsingAudio,
  }
}
