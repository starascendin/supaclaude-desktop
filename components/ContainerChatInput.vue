<template>
  <div class="border-t bg-white">
    <form @submit.prevent="handleSubmit" class="px-4 py-4">
      <div class="max-w-4xl mx-auto">
        <div class="relative">
          <textarea
            ref="textareaRef"
            v-model="input"
            @keydown="handleKeydown"
            :disabled="disabled"
            :placeholder="placeholder"
            class="w-full px-4 py-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            :class="{ 'opacity-50': disabled }"
            rows="3"
          />
          <button
            type="submit"
            :disabled="disabled || !input.trim()"
            class="absolute bottom-3 right-3 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="disabled || !input.trim() ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'"
          >
            <svg v-if="isStreaming" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        
        <!-- Continue thread toggle -->
        <div v-if="selectedSessionId" class="mt-2 flex items-center gap-2">
          <label class="flex items-center gap-2 text-xs">
            <input 
              type="checkbox" 
              v-model="continueThread"
              class="rounded border-gray-300 focus:ring-blue-500"
            />
            <span class="text-gray-700">Continue current thread ({{ selectedSessionId.substring(0, 8) }})</span>
          </label>
        </div>
        
        <!-- Container-specific hints -->
        <div v-if="containerId" class="mt-2 text-xs text-gray-500">
          <p>You can ask me to run commands in the container or manage container operations.</p>
          <p v-if="disabled && containerStatus !== 'running'" class="text-red-500 mt-1">
            Container is not running. Start the container to send commands.
          </p>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
  containerId?: string
  containerStatus?: string
  selectedSessionId?: string
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  containerStatus: 'unknown',
  isStreaming: false
})

const emit = defineEmits<{
  submit: [content: string, options?: { continueThread?: boolean, sessionId?: string }]
}>()

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const continueThread = ref(true) // Default to continuing when a session is selected

const placeholder = computed(() => {
  if (props.containerId) {
    return props.containerStatus === 'running' 
      ? 'Ask me to run commands or manage this container...'
      : 'Start the container to send commands...'
  }
  return 'Send a message...'
})

const handleSubmit = () => {
  if (input.value.trim() && !props.disabled) {
    const options = props.selectedSessionId && continueThread.value 
      ? { continueThread: true, sessionId: props.selectedSessionId }
      : undefined
    
    emit('submit', input.value, options)
    input.value = ''
    
    // Reset textarea height
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

// Auto-resize textarea
watch(input, () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
  })
})

// Focus on mount
onMounted(() => {
  textareaRef.value?.focus()
})
</script>