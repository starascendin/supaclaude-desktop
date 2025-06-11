<template>
  <div class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
    <div class="p-4 border-b border-gray-200">
      <h2 class="font-semibold text-gray-900">Chat Sessions</h2>
      <label class="flex items-center gap-2 mt-2">
        <input 
          type="checkbox" 
          v-model="showThreadChains"
          class="rounded border-gray-300 focus:ring-blue-500"
        />
        <span class="text-xs text-gray-600">Show thread connections</span>
      </label>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-4 text-sm text-gray-500">
        Loading sessions...
      </div>
      
      <div v-else-if="sessions.length === 0 && threadChains.length === 0" class="p-4 text-sm text-gray-500">
        No sessions found
      </div>
      
      <!-- Thread chains view -->
      <div v-else-if="showThreadChains" class="space-y-3 p-2">
        <div 
          v-for="chain in threadChains" 
          :key="chain.rootSessionId"
          class="border rounded-md bg-white"
        >
          <div class="p-2 bg-gray-50 border-b text-xs font-medium text-gray-700">
            Thread ({{ chain.length }} parts)
          </div>
          <div class="p-1">
            <div
              v-for="(session, index) in chain.sessions"
              :key="session.id"
              class="relative"
            >
              <button
                @click="$emit('sessionSelected', session.id)"
                :class="[
                  'w-full text-left p-2 rounded text-xs transition-colors',
                  selectedSessionId === session.id 
                    ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                    : 'hover:bg-gray-100 text-gray-700'
                ]"
              >
                <div class="flex items-center gap-2">
                  <div class="flex-shrink-0">
                    <div :class="[
                      'w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold',
                      session.isRoot ? 'bg-green-500' : session.isLatest ? 'bg-blue-500' : 'bg-gray-400'
                    ]">
                      {{ session.position }}
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate text-xs">{{ session.summary }}</div>
                    <div class="text-xs text-gray-500 flex items-center justify-between">
                      <span>{{ session.id.substring(0, 8) }}...</span>
                      <span class="text-xs">{{ session.messageCount }} msgs</span>
                    </div>
                  </div>
                </div>
              </button>
              
              <!-- Connection arrow -->
              <div v-if="index < chain.sessions.length - 1" class="flex justify-center py-1">
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Regular sessions view -->
      <div v-else class="space-y-1 p-2">
        <button
          v-for="session in sessions"
          :key="session.id"
          @click="$emit('sessionSelected', session.id)"
          :class="[
            'w-full text-left p-3 rounded-md text-sm transition-colors',
            selectedSessionId === session.id 
              ? 'bg-blue-100 text-blue-900 border border-blue-200' 
              : 'hover:bg-gray-100 text-gray-700'
          ]"
        >
          <div class="font-medium truncate">{{ session.summary }}</div>
          <div class="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{{ session.id.substring(0, 8) }}...</span>
            <span v-if="session.threadLength > 1" class="bg-gray-200 px-1 rounded text-xs">
              {{ session.threadLength }} parts
            </span>
          </div>
        </button>
      </div>
    </div>
    
    <div class="p-4 border-t border-gray-200">
      <button
        @click="refreshSessions"
        :disabled="loading"
        class="w-full p-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
      >
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Session {
  id: string
  summary: string
  filename: string
  threadLength?: number
  rootSessionId?: string
}

interface Props {
  containerId: string
  selectedSessionId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sessionSelected: [sessionId: string]
}>()

const sessions = ref<Session[]>([])
const threadChains = ref<any[]>([])
const loading = ref(false)
const showThreadChains = ref(false)

const loadSessions = async () => {
  if (!props.containerId) return
  
  loading.value = true
  try {
    // Load both regular sessions and thread chains
    const [sessionsResponse, chainsResponse] = await Promise.all([
      $fetch<{ sessions: Session[] }>(`http://localhost:8000/api/docker/containers/${props.containerId}/sessions`),
      $fetch<{ threadChains: any[] }>(`http://localhost:8000/api/docker/containers/${props.containerId}/thread-chains`)
    ])
    
    sessions.value = sessionsResponse.sessions
    threadChains.value = chainsResponse.threadChains
  } catch (error) {
    console.error('Failed to load sessions:', error)
    sessions.value = []
    threadChains.value = []
  } finally {
    loading.value = false
  }
}

const refreshSessions = () => {
  loadSessions()
}

// Load sessions when container ID changes
watch(() => props.containerId, loadSessions, { immediate: true })

// Expose refreshSessions method to parent
defineExpose({
  refreshSessions
})
</script>