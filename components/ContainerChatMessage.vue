<template>
  <div class="group flex gap-3 px-4 py-6 hover:bg-gray-50">
    <div class="flex-shrink-0">
      <div 
        v-if="message.role === 'user'"
        class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium"
      >
        U
      </div>
      <div 
        v-else-if="message.role === 'assistant'"
        class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    </div>
    
    <div class="flex-1 overflow-x-auto">
      <div class="font-semibold text-sm mb-2">
        {{ message.role === 'user' ? 'You' : 'Container Assistant' }}
      </div>
      
      <div v-if="message.type === 'thinking'" class="text-gray-500 italic">
        Thinking...
      </div>
      
      <div v-else-if="message.type === 'start'" class="text-gray-500">
        Starting response...
      </div>
      
      <div v-else-if="message.type === 'end'" class="text-gray-500">
        Response complete
      </div>
      
      <div v-else class="prose prose-sm max-w-none">
        <div v-html="renderMarkdown(message.content)"></div>
      </div>
      
      <!-- Command execution indicator for container commands -->
      <div v-if="message.executionInfo" class="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
        <div class="flex items-center gap-2">
          <span class="text-gray-600">Container:</span>
          <span class="font-medium">{{ message.executionInfo.containerId.substring(0, 12) }}</span>
          <span v-if="message.executionInfo.command" class="text-gray-600 ml-2">Command:</span>
          <span v-if="message.executionInfo.command" class="font-medium">{{ message.executionInfo.command }}</span>
        </div>
      </div>
    </div>
    
    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        @click="copyToClipboard(message.content)"
        class="p-1 hover:bg-gray-200 rounded"
        title="Copy message"
      >
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

interface ContainerMessage {
  role: 'user' | 'assistant'
  content: string
  type?: 'start' | 'thinking' | 'content' | 'end' | 'assistant'
  executionInfo?: {
    containerId: string
    command?: string
    exitCode?: number
  }
}

defineProps<{
  message: ContainerMessage
}>()

const renderMarkdown = (content: string) => {
  const rawHtml = marked(content, { breaks: true })
  return DOMPurify.sanitize(rawHtml)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}
</script>