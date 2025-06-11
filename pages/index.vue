<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Messages Container -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto">
      <!-- Welcome Screen -->
      <div v-if="messages.length === 0" class="h-full flex items-center justify-center px-4">
        <div class="text-center max-w-3xl w-full">
          <h1 class="text-3xl font-normal text-gray-700 mb-12 flex items-center justify-center gap-3">
            <span class="text-orange-500">✳</span>
            Coffee and Claude time?
          </h1>
          
          <!-- Chat Input in center -->
          <div class="relative">
            <ChatInput 
              :disabled="isStreaming" 
              @submit="sendMessage"
              placeholder="How can I help you today?"
              :show-model-selector="true"
            />
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-else class="max-w-4xl mx-auto">
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

    <!-- Input (when messages exist) -->
    <div v-if="messages.length > 0" class="border-t bg-white">
      <div class="max-w-4xl mx-auto">
        <ChatInput 
          :disabled="isStreaming" 
          @submit="sendMessage" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChat } from '~/src/libs/chat'

const { messages, isStreaming, sendMessage } = useChat()
const scrollContainer = ref<HTMLElement>()

// Auto-scroll to bottom when new messages arrive
watch(messages, () => {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>