<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Session Sidebar -->
    <SessionSidebar 
      ref="sessionSidebar"
      :containerId="containerId" 
      :selectedSessionId="selectedSessionId"
      @sessionSelected="loadSession"
    />
    
    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Container Info Banner -->
      <div class="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NuxtLink to="/containers" class="p-1 hover:bg-blue-100 rounded">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </NuxtLink>
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
          <span v-if="containerName" class="text-sm text-blue-700">{{ containerName }}</span>
          <span v-if="containerModel" class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs capitalize">
            {{ containerModel }}
          </span>
          <span v-if="containerHasMcp" class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            MCP
          </span>
          <span v-if="selectedSessionId" class="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
            Session: {{ selectedSessionId.substring(0, 8) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="containerConfig"
            @click="showContainerConfigModal"
            size="sm"
            variant="outline"
            class="text-xs"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Config
          </Button>
          <Button @click="toggleLogs" size="sm" variant="outline" class="text-xs">
            {{ showLogs ? 'Hide' : 'Show' }} Logs
          </Button>
          <Button 
            @click="createMcpFile" 
            :loading="isCreatingMcp"
            loading-text="Creating..."
            size="sm" 
            variant="outline" 
            class="text-xs"
          >
            Create MCP
          </Button>
          <Button 
            v-if="containerStatus === 'exited'" 
            @click="startContainer"
            :loading="isStartingContainer"
            loading-text="Starting..."
            size="sm" 
            variant="outline"
            class="text-xs text-green-600 hover:text-green-700"
          >
            Start Container
          </Button>
          <Button 
            v-if="containerStatus === 'running'" 
            @click="stopContainer"
            :loading="isStoppingContainer"
            loading-text="Stopping..."
            size="sm" 
            variant="outline"
            class="text-xs text-orange-600 hover:text-orange-700"
          >
            Stop Container
          </Button>
        </div>
      </div>
    </div>

    <!-- Container Logs -->
    <div v-if="showLogs" class="bg-black text-green-400 font-mono text-xs p-4 max-h-48 overflow-y-auto border-b">
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
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 class="text-2xl font-semibold mb-2">Container Assistant</h2>
          <p class="text-gray-600 mb-4">
            Chat with container {{ containerId.substring(0, 12) }}
          </p>
          <div class="text-sm text-gray-500 space-y-1">
            <p>You can ask me to:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li>Run commands in the container</li>
              <li>Check container status and logs</li>
              <li>Install packages or dependencies</li>
              <li>Debug issues within the container</li>
              <li>Execute Python scripts with Claude SDK</li>
            </ul>
          </div>
        </div>

        <!-- Messages -->
        <div v-else>
          <ContainerChatMessage 
            v-for="(message, index) in messages" 
            :key="index" 
            :message="message" 
          />
          
          <!-- Loading indicator -->
          <div v-if="isStreaming" class="flex gap-3 px-4 py-6">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm mb-2">Container Assistant</div>
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
      <ContainerChatInput 
        :disabled="isStreaming || containerStatus !== 'running'" 
        :containerId="containerId"
        :containerStatus="containerStatus"
        :selectedSessionId="selectedSessionId"
        :isStreaming="isStreaming"
        @submit="handleSendCommand" 
      />
    </div>
    
    <!-- Container Config Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="showConfigModal = false">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Container Configuration</h3>
          <Button
            @click="showConfigModal = false"
            variant="ghost"
            size="icon"
            class="h-6 w-6"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-700">YAML Configuration</span>
              <span class="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
            <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{{ configModalContent }}</pre>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end">
          <Button @click="showConfigModal = false" variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContainerChat } from '~/composables/useContainerChat'

const route = useRoute()
const router = useRouter()
const containerId = computed(() => route.query.container as string)

// Redirect if no container ID
if (!containerId.value) {
  router.push('/containers')
}

const showLogs = ref(false)
const containerLogs = ref<string[]>([])
const containerStatus = ref('unknown')
const containerName = ref('')
const containerModel = ref<string | null>(null)
const containerConfig = ref<any>(null)
const containerHasMcp = ref(false)
const showConfigModal = ref(false)
const configModalContent = ref('')
const selectedSessionId = ref<string | undefined>()
const sessionSidebar = ref<any>()
const isStartingContainer = ref(false)
const isStoppingContainer = ref(false)
const isCreatingMcp = ref(false)

const API_BASE = 'http://localhost:8000'

// Initialize container chat
const chatContext = reactive({
  containerId: containerId.value,
  containerStatus: containerStatus.value,
  containerLogs: containerLogs.value
})

const { messages, isStreaming, scrollContainer, sendCommand, addSystemMessage, loadSessionMessages, onSessionCreated } = useContainerChat(chatContext)

const handleSendCommand = (content: string, options?: { continueThread?: boolean, sessionId?: string }) => {
  sendCommand(content, options)
}

const toggleLogs = () => {
  showLogs.value = !showLogs.value
  if (showLogs.value) {
    fetchContainerLogs()
  }
}

const fetchContainerLogs = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/logs`)
    const data = await response.json()
    containerLogs.value = data.logs || []
  } catch (error) {
    console.error('Failed to fetch container logs:', error)
  }
}

const fetchContainerInfo = async () => {
  try {
    // Get container status
    const statusResponse = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/status`)
    const statusData = await statusResponse.json()
    containerStatus.value = statusData.status || 'unknown'
    
    // Update context
    chatContext.containerStatus = containerStatus.value
    
    // Get container details
    const response = await fetch(`${API_BASE}/api/docker/containers`)
    const data = await response.json()
    const container = data.containers?.find((c: any) => 
      (c.Id || c.id) === containerId.value
    )
    
    if (container) {
      if (container.Names && container.Names.length > 0) {
        containerName.value = container.Names[0].replace(/^\//, '')
      } else if (container.name) {
        containerName.value = container.name
      }
      
      // Extract model and config information
      const labels = container.Labels || container.DetailedConfig?.Labels || container.labels || {}
      containerModel.value = labels['claude.model'] || null
      containerHasMcp.value = !!labels['claude.mcpConfig']
      containerConfig.value = container
    }
  } catch (error) {
    console.error('Failed to fetch container info:', error)
  }
}

const startContainer = async () => {
  try {
    isStartingContainer.value = true
    await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/start`, { method: 'POST' })
    await fetchContainerInfo()
    addSystemMessage('Container started successfully.')
  } catch (error) {
    console.error('Failed to start container:', error)
    addSystemMessage('Failed to start container.')
  } finally {
    isStartingContainer.value = false
  }
}

const stopContainer = async () => {
  try {
    isStoppingContainer.value = true
    await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/stop`, { method: 'POST' })
    await fetchContainerInfo()
    addSystemMessage('Container stopped successfully.')
  } catch (error) {
    console.error('Failed to stop container:', error)
    addSystemMessage('Failed to stop container.')
  } finally {
    isStoppingContainer.value = false
  }
}

const createMcpFile = async () => {
  try {
    isCreatingMcp.value = true
    console.log('[CONTAINER_CHAT] Creating MCP file for container:', containerId.value)
    const response = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/create-mcp`, { method: 'POST' })
    const result = await response.json()
    
    if (response.ok) {
      addSystemMessage('MCP configuration file created successfully.')
      console.log('[CONTAINER_CHAT] MCP file created:', result)
    } else {
      addSystemMessage(`Failed to create MCP file: ${result.error}`)
      console.error('[CONTAINER_CHAT] Failed to create MCP file:', result)
    }
  } catch (error) {
    console.error('Failed to create MCP file:', error)
    addSystemMessage('Failed to create MCP file.')
  } finally {
    isCreatingMcp.value = false
  }
}

// Function to show container configuration modal
const showContainerConfigModal = () => {
  if (!containerConfig.value) return
  
  try {
    const container = containerConfig.value
    const labels = container.Labels || container.DetailedConfig?.Labels || container.labels || {}
    const config: any = {}
    
    // Add model information
    if (labels['claude.model']) {
      config.model = labels['claude.model']
    }
    if (labels['claude.systemPrompt']) {
      config.system_prompt = labels['claude.systemPrompt']
    }
    
    // Add basic container info
    const image = container.DetailedConfig?.Image || container.Image || container.image
    if (image) {
      config.image = image
    }
    
    // Add working directory
    if (container.DetailedConfig?.WorkingDir) {
      config.working_dir = container.DetailedConfig.WorkingDir
    }
    
    // Add environment variables (excluding sensitive ones)
    if (container.DetailedConfig?.Env && container.DetailedConfig.Env.length > 0) {
      const envObj: Record<string, string> = {}
      container.DetailedConfig.Env.forEach((env: string) => {
        const [key, ...valueParts] = env.split('=')
        if (key && key !== 'ANTHROPIC_API_KEY' && !key.includes('CREDENTIAL')) {
          envObj[key] = valueParts.join('=')
        }
      })
      if (Object.keys(envObj).length > 0) {
        config.environment = envObj
      }
    }
    
    // Add volume mounts (excluding sensitive ones)
    if (container.HostConfig?.Binds && container.HostConfig.Binds.length > 0) {
      const volumes = container.HostConfig.Binds.filter((bind: string) => 
        !bind.includes('.credentials.json') && !bind.includes('credential')
      )
      if (volumes.length > 0) {
        config.volumes = volumes
      }
    }
    
    // Add resource limits
    if (container.HostConfig?.Memory) {
      const mb = Math.round(container.HostConfig.Memory / (1024 * 1024))
      config.memory = `${mb}m`
    }
    if (container.HostConfig?.CpuQuota && container.HostConfig?.CpuPeriod) {
      config.cpus = container.HostConfig.CpuQuota / container.HostConfig.CpuPeriod
    }
    
    // Add MCP configuration info if available
    if (labels['claude.mcpConfig']) {
      try {
        const mcpConfig = JSON.parse(labels['claude.mcpConfig'])
        if (mcpConfig.mcpServers) {
          config.mcp_servers = Object.keys(mcpConfig.mcpServers)
          config.mcp_enabled = true
        }
      } catch (e) {
        // Ignore parsing errors
      }
    } else {
      config.mcp_enabled = false
    }
    
    // Add container metadata
    config.name = containerName.value
    config.status = containerStatus.value
    config.container_id = containerId.value.substring(0, 12)
    
    // Convert to YAML format
    const yamlContent = Object.entries(config)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.includes('\n')) {
          return `${key}: |\n  ${value.split('\n').join('\n  ')}`
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          return `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}`
        } else if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - ${JSON.stringify(v)}`).join('\n')}`
        } else {
          return `${key}: ${JSON.stringify(value)}`
        }
      })
      .join('\n')
    
    configModalContent.value = yamlContent || 'No configuration available'
    showConfigModal.value = true
  } catch (error) {
    console.error('Failed to show container config:', error)
  }
}

// Initialize on mount
onMounted(() => {
  fetchContainerInfo()
  
  // Set up session created callback
  onSessionCreated.value = async () => {
    console.log('[CONTAINER_CHAT_PAGE] Session created, refreshing sidebar')
    
    // Refresh the sidebar to show new session
    if (sessionSidebar.value) {
      await sessionSidebar.value.refreshSessions()
      
      // Also check for the new latest session in the thread
      if (selectedSessionId.value) {
        try {
          // Get the updated thread info
          const response = await fetch(`${API_BASE}/api/docker/containers/${containerId.value}/thread-chains`)
          const data = await response.json()
          
          // Find the thread containing our current session
          const currentThread = data.threadChains?.find((chain: any) => 
            chain.sessions.some((s: any) => s.id === selectedSessionId.value)
          )
          
          if (currentThread && currentThread.latestSessionId !== selectedSessionId.value) {
            // Update to the new latest session
            console.log('[CONTAINER_CHAT_PAGE] New session created:', currentThread.latestSessionId)
            selectedSessionId.value = currentThread.latestSessionId
            
            // Load the new session content
            await loadSession(currentThread.latestSessionId)
          }
        } catch (error) {
          console.error('Failed to check for new session:', error)
        }
      }
    }
  }
  
  // Refresh container status periodically
  const interval = setInterval(() => {
    fetchContainerInfo()
    if (showLogs.value) {
      fetchContainerLogs()
    }
  }, 5000)
  
  onUnmounted(() => clearInterval(interval))
})

const loadSession = async (sessionId: string) => {
  selectedSessionId.value = sessionId
  await loadSessionMessages(sessionId)
}

// Update context when status changes
watch(containerStatus, (newStatus) => {
  chatContext.containerStatus = newStatus
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