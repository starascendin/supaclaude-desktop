<template>
  <div class="flex gap-3 px-4 py-6 hover:bg-gray-50/50">
    <div class="flex-shrink-0">
      <div 
        class="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
        :class="message.role === 'user' ? 'bg-gray-700' : 'bg-purple-600'"
      >
        {{ message.role === 'user' ? 'U' : 'C' }}
      </div>
    </div>
    <div class="flex-1 space-y-2 overflow-hidden">
      <div class="font-semibold text-sm">
        {{ message.role === 'user' ? 'You' : 'Claude' }}
        <span v-if="message.type" class="text-xs text-gray-500 ml-2">({{ message.type }})</span>
      </div>
      <div class="prose prose-sm max-w-none">
        <pre class="whitespace-pre-wrap bg-gray-100 p-3 rounded text-sm">{{ JSON.stringify(message, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'start' | 'thinking' | 'content' | 'end'
}

defineProps<{
  message: Message
}>()
</script>