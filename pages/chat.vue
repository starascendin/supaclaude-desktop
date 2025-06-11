<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Container Info Banner -->
    <div v-if="containerId" class="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span class="text-sm font-medium text-blue-800">Container: {{ containerId.substring(0, 12) }}</span>
          <span 
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="containerStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            {{ containerStatus }}
          </span>
        </div>
        <Button @click="toggleLogs" size="sm" variant="outline" class="text-xs">
          {{ showLogs ? 'Hide' : 'Show' }} Logs
        </Button>
      </div>
    </div>

    <!-- Container Logs -->
    <div v-if="containerId && showLogs" class="bg-black text-green-400 font-mono text-xs p-4 max-h-48 overflow-y-auto border-b">
      <div v-if="containerLogs.length === 0" class="text-gray-500">No logs available</div>
      <div v-else>
        <div v-for="(log, index) in containerLogs" :key="index" class="whitespace-pre-wrap">{{ log }}</div>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto">
        <!-- Welcome message when no messages -->
        <div v-if="messages.length === 0" class="text-center py-20 px-4">
          <h2 class="text-2xl font-semibold mb-2">
            {{ containerId ? 'Container Chat' : 'Welcome to SupaClaude' }}
          </h2>
          <p class="text-gray-600">
            {{ containerId ? `Chat with container ${containerId.substring(0, 12)}` : 'Start a conversation with Claude' }}
          </p>
        </div>

        <!-- Messages -->
        <div v-else>
          <ChatMessage 
            v-for="(message, index) in messages" 
            :key="index" 
            :message="message" 
          />
          
          <!-- Loading indicator -->
          <div v-if="isStreaming" class="flex gap-3 px-4 py-6">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                C
              </div>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm mb-2">Claude</div>
              <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <ChatInput 
      :disabled="isStreaming || (containerId && containerStatus !== 'running')" 
      @submit="sendMessageWithContext" 
    />
  </div>
</template>

<script setup lang="ts">
import { useChat } from '~/src/libs/chat'

const route = useRoute()
const containerId = computed(() => route.query.container as string)

const { messages, isStreaming, scrollContainer, sendMessage } = useChat()

const showLogs = ref(false)
const containerLogs = ref<string[]>([])
const containerStatus = ref('unknown')

const API_BASE = 'http://localhost:8000'

const toggleLogs = () => {
  showLogs.value = !showLogs.value
  if (showLogs.value && containerId.value) {
    fetchContainerLogs()
  }
}

const fetchContainerLogs = async () => {
  if (!containerId.value) return
  
  try {
    const response = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/logs`)
    const data = await response.json()
    containerLogs.value = data.logs || []
  } catch (error) {
    console.error('Failed to fetch container logs:', error)
  }
}

const fetchContainerStatus = async () => {
  if (!containerId.value) return
  
  try {
    const response = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/status`)
    const data = await response.json()
    containerStatus.value = data.status || 'unknown'
  } catch (error) {
    console.error('Failed to fetch container status:', error)
  }
}

// Override sendMessage to include container context
const sendMessageWithContext = (content: string) => {
  const context = containerId.value ? {
    containerId: containerId.value,
    executionMode: 'docker'
  } : {}
  
  sendMessage(content, context)
}

// Fetch container info on mount and when containerId changes
watch(containerId, () => {
  if (containerId.value) {
    fetchContainerStatus()
    if (showLogs.value) {
      fetchContainerLogs()
    }
  }
}, { immediate: true })

// Refresh container status periodically
onMounted(() => {
  const interval = setInterval(() => {
    if (containerId.value) {
      fetchContainerStatus()
      if (showLogs.value) {
        fetchContainerLogs()
      }
    }
  }, 5000)
  
  onUnmounted(() => clearInterval(interval))
})
</script>

<style>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>