<template>
  <div :class="showModelSelector ? '' : 'border-t bg-white p-4'">
    <div :class="showModelSelector ? '' : 'max-w-4xl mx-auto'">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="relative">
          <textarea
            v-model="input"
            @keydown.enter.prevent="handleSubmit"
            :disabled="disabled"
            :placeholder="placeholder"
            class="w-full resize-none rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            :rows="rows"
          />
          <div class="absolute right-2 bottom-3 flex items-center gap-2">
            <button
              @click="handleSubmit"
              :disabled="!input.trim() || disabled"
              class="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-gray-600"
              >
                <line x1="22" x2="11" y1="2" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Model selector and capabilities (when shown) -->
        <div v-if="showModelSelector" class="border-t px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <button class="flex items-center gap-2 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m18 16 4-4-4-4" />
                <path d="m6 8-4 4 4 4" />
                <path d="m14.5 4-5 16" />
              </svg>
              <span>Code</span>
            </button>
            <button class="flex items-center gap-2 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>Write</span>
            </button>
            <button class="flex items-center gap-2 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <span>Learn</span>
            </button>
          </div>
          
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">Claude Opus 4</span>
            <button class="p-1 hover:bg-gray-100 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
  showModelSelector?: boolean
}>()

const emit = defineEmits<{
  submit: [message: string]
}>()

const input = ref('')

const rows = computed(() => {
  const lines = input.value.split('\n').length
  return Math.min(Math.max(lines, 3), 10)
})

const handleSubmit = () => {
  if (input.value.trim() && !props.disabled) {
    emit('submit', input.value)
    input.value = ''
  }
}
</script>