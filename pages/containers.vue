<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-6xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Container Projects</h1>
          <p class="text-gray-600">Manage Docker containers running Claude SDK</p>
        </div>

        <!-- Controls -->
        <div class="flex gap-4 mb-6">
          <Button 
            @click="refreshContainers" 
            :loading="loading"
            loading-text="Refreshing..."
            class="flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          
          <!-- Preset Dropdown -->
          <PresetDropdown 
            @preset-selected="handlePresetSelected" 
            @create-container="createContainerWithPreset"
          />
          
          <Button 
            @click="createContainer" 
            :loading="creatingContainer"
            loading-text="Creating..."
            variant="default" 
            class="flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Container
          </Button>
          <Button 
            v-if="selectedContainers.size > 0" 
            @click="startSelectedContainers"
            :loading="startingSelectedContainers"
            loading-text="Starting..." 
            variant="outline" 
            class="flex items-center gap-2 text-green-600 hover:text-green-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Selected ({{ selectedContainers.size }})
          </Button>
          <Button 
            v-if="selectedContainers.size > 0" 
            @click="stopSelectedContainers"
            :loading="stoppingSelectedContainers"
            loading-text="Stopping..." 
            variant="outline" 
            class="flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Selected ({{ selectedContainers.size }})
          </Button>
          <Button 
            v-if="selectedContainers.size > 0" 
            @click="deleteSelectedContainers"
            :loading="deletingSelectedContainers"
            loading-text="Deleting..." 
            variant="destructive" 
            class="flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected ({{ selectedContainers.size }})
          </Button>
        </div>

        <!-- Docker Status -->
        <div v-if="dockerStatus" class="mb-6 p-4 rounded-lg border" :class="dockerStatus.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="dockerStatus.available ? 'bg-green-500' : 'bg-red-500'"></div>
            <span class="font-medium">Docker Status: {{ dockerStatus.available ? 'Available' : 'Unavailable' }}</span>
          </div>
          <p class="text-sm text-gray-600 mt-1">{{ dockerStatus.message }}</p>
        </div>

        <!-- Containers List -->
        <div v-if="loading && containers.length === 0" class="text-center py-12">
          <div class="animate-pulse">Loading containers...</div>
        </div>
        
        <div v-else-if="containers.length === 0" class="text-center py-12">
          <div class="text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>No containers found</p>
            <p class="text-sm">Create a new container to get started</p>
          </div>
        </div>

        <div v-if="containers.length > 0" class="space-y-4">
          <!-- Select All -->
          <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-600">
                {{ selectedContainers.size === 0 ? 'Select all' : `${selectedContainers.size} of ${containers.length} selected` }}
              </span>
            </label>
          </div>

          <!-- Containers Grid -->
          <div class="grid gap-4">
          <div 
            v-for="container in containers" 
            :key="container.id"
            class="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            :class="{ 'ring-2 ring-blue-500': isSelected(container) }"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1">
                <input 
                  type="checkbox"
                  :checked="isSelected(container)"
                  @change="toggleSelection(container)"
                  @click.stop
                  class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div class="flex-1 cursor-pointer" @click="selectContainer(container)">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="font-semibold text-lg">{{ getContainerName(container) }}</h3>
                    <span 
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="getStatusColor(getContainerStatus(container))"
                    >
                      {{ getContainerStatus(container) }}
                    </span>
                  </div>
                  
                  <div class="text-sm text-gray-600 space-y-1">
                    <p><span class="font-medium">Image:</span> {{ container.Image || container.image || 'N/A' }}</p>
                    <p><span class="font-medium">ID:</span> {{ (container.Id || container.id || 'unknown').substring(0, 12) }}</p>
                    <p v-if="container.Created || container.created"><span class="font-medium">Created:</span> {{ formatDate(container.Created || container.created) }}</p>
                    <p v-if="container.Ports && container.Ports.length"><span class="font-medium">Ports:</span> {{ container.Ports.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(', ') }}</p>
                    <p v-else-if="container.ports && container.ports.length"><span class="font-medium">Ports:</span> {{ container.ports.join(', ') }}</p>
                    
                    <!-- Container Labels Info -->
                    <div class="flex items-center gap-2 mt-2">
                      <span v-if="getContainerModel(container)" class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs capitalize">
                        {{ getContainerModel(container) }}
                      </span>
                      <span v-if="containerHasMcp(container)" class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        MCP
                      </span>
                      <Button
                        @click.stop="showContainerConfig(container)"
                        variant="outline"
                        size="sm"
                        class="text-xs h-6 px-2"
                      >
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Config
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex gap-2 ml-4">
                <Button 
                  v-if="getContainerStatus(container) === 'exited'" 
                  @click.stop="startContainer(getContainerId(container))"
                  :loading="startingIndividualContainers.has(getContainerId(container))"
                  loading-text="Starting..."
                  size="sm" 
                  variant="outline"
                  class="text-green-600 hover:text-green-700"
                >
                  Start
                </Button>
                <Button 
                  v-if="getContainerStatus(container) === 'running'" 
                  @click.stop="stopContainer(getContainerId(container))"
                  :loading="stoppingIndividualContainers.has(getContainerId(container))"
                  loading-text="Stopping..."
                  size="sm" 
                  variant="outline"
                  class="text-orange-600 hover:text-orange-700"
                >
                  Stop
                </Button>
                <Button 
                  @click.stop="removeContainer(getContainerId(container))"
                  :loading="removingIndividualContainers.has(getContainerId(container))"
                  loading-text="Removing..."
                  size="sm" 
                  variant="outline"
                  class="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preset Configuration Panel -->
    <PresetConfigPanel />
    
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
import { Button } from '~/components/ui/button'
import PresetDropdown from '~/components/PresetDropdown.vue'
import PresetConfigPanel from '~/components/PresetConfigPanel.vue'
import { useContainerPresets } from '~/composables/useContainerPresets'

interface Container {
  // Docker API format (capitalized)
  Id?: string
  Names?: string[]
  Image?: string
  State?: string
  Status?: string
  Created?: number
  Ports?: Array<{PublicPort?: number, PrivatePort: number, Type: string}>
  Labels?: Record<string, string>
  
  // Enhanced detailed info
  DetailedConfig?: {
    Image?: string
    WorkingDir?: string
    Env?: string[]
    Labels?: Record<string, string>
  }
  HostConfig?: {
    Memory?: number
    CpuQuota?: number
    CpuPeriod?: number
    Binds?: string[]
  }
  
  // Fallback format (lowercase)
  id?: string
  name?: string
  image?: string
  status?: string
  created?: string
  ports?: string[]
  labels?: Record<string, string>
}

interface DockerStatus {
  available: boolean
  message: string
  imageExists?: boolean
}

const containers = ref<Container[]>([])
const dockerStatus = ref<DockerStatus | null>(null)
const loading = ref(false)
const creatingContainer = ref(false)
const startingSelectedContainers = ref(false)
const stoppingSelectedContainers = ref(false)
const deletingSelectedContainers = ref(false)
const startingIndividualContainers = ref<Set<string>>(new Set())
const stoppingIndividualContainers = ref<Set<string>>(new Set())
const removingIndividualContainers = ref<Set<string>>(new Set())
const selectedContainers = ref<Set<string>>(new Set())
const showConfigModal = ref(false)
const configModalContent = ref('')

const API_BASE = 'http://localhost:8000'

// Preset management
const { presets, selectedPreset, selectedPresetId, updatePreset, initialize: initializePresets } = useContainerPresets()

const handlePresetSelected = (presetId: string) => {
  console.log('[CONTAINERS] Selected preset:', presetId)
  selectedPresetId.value = presetId
  // Persist selection
  if (typeof window !== 'undefined') {
    localStorage.setItem('selected-preset-id', presetId)
  }
}

const createContainerWithPreset = async (presetId: string) => {
  console.log('[CONTAINERS] Creating container with preset:', presetId)
  await createContainer(presetId)
}

const refreshContainers = async () => {
  loading.value = true
  try {
    // Check Docker status
    const statusResponse = await fetch(`${API_BASE}/api/docker/status`)
    dockerStatus.value = await statusResponse.json()
    
    // Get containers
    const response = await fetch(`${API_BASE}/api/docker/containers`)
    const data = await response.json()
    
    console.log('[CONTAINERS] Raw API response:', data)
    
    // Filter containers to only show those using the specific Claude image
    const allContainers = data.containers || []
    const claudeContainers = allContainers.filter((container: Container) => {
      const image = container.Image || container.image || ''
      return image.includes('ghcr.io/starascendin/cldauthed-python')
    })
    
    console.log('[CONTAINERS] Filtered Claude containers:', claudeContainers)
    containers.value = claudeContainers
  } catch (error) {
    console.error('Failed to fetch containers:', error)
  } finally {
    loading.value = false
  }
}

const selectContainer = (container: Container) => {
  // Navigate to container-specific chat page
  navigateTo(`/container-chat?container=${getContainerId(container)}`)
}

const createContainer = async (presetId?: string) => {
  try {
    creatingContainer.value = true
    console.log('[CONTAINERS] === CREATE CONTAINER START ===')
    console.log('[CONTAINERS] presetId param:', presetId)
    console.log('[CONTAINERS] selectedPresetId.value:', selectedPresetId.value)
    console.log('[CONTAINERS] Available presets:', presets.value.map(p => ({ id: p.id, name: p.name, hasMcp: !!p.config.mcpConfig })))
    
    // Use specific preset ID or fall back to currently selected preset or default
    let presetToUse = presetId || selectedPresetId.value
    
    // If still no preset, force select the default
    if (!presetToUse && presets.value.length > 0) {
      const defaultPreset = presets.value.find(p => p.id === 'default') || presets.value[0]
      if (defaultPreset) {
        presetToUse = defaultPreset.id
        selectedPresetId.value = defaultPreset.id
        console.log('[CONTAINERS] No preset selected, forcing default:', defaultPreset.id)
      }
    }
    
    console.log('[CONTAINERS] presetToUse:', presetToUse)
    
    // Get preset configuration if provided
    let containerConfig: any = {
      name: `claude-container-${Date.now()}`,
      // Default model if no preset is used
      model: 'sonnet',
      // ALWAYS include default MCP config
      mcpConfig: {
        mcpServers: {
          exa: {
            command: "npx",
            args: [
              "-y",
              "@smithery/cli@latest",
              "run",
              "exa",
              "--key",
              "20f79417-8898-4f2e-9356-3265d2c11e40"
            ]
          }
        }
      }
    }
    
    const preset = presetToUse ? presets.value.find(p => p.id === presetToUse) : null
    console.log('[CONTAINERS] Found preset:', preset ? `${preset.name} (id: ${preset.id})` : 'NONE')
    
    if (preset) {
      console.log('[CONTAINERS] Using preset configuration:', JSON.stringify(preset, null, 2))
      
      // Apply preset configuration
      if (preset.config.image) {
        containerConfig.image = preset.config.image
      }
      if (preset.config.environment) {
        containerConfig.environment = preset.config.environment
      }
      if (preset.config.volumes) {
        containerConfig.volumes = preset.config.volumes
      }
      if (preset.config.command) {
        containerConfig.command = preset.config.command
      }
      if (preset.config.workingDir) {
        containerConfig.workingDir = preset.config.workingDir
      }
      if (preset.config.memory) {
        containerConfig.memory = preset.config.memory
      }
      if (preset.config.cpus) {
        containerConfig.cpus = preset.config.cpus
      }
      if (preset.config.systemPrompt) {
        containerConfig.systemPrompt = preset.config.systemPrompt
      }
      if (preset.config.model) {
        containerConfig.model = preset.config.model
      }
      if (preset.config.mcpConfig) {
        console.log('[CONTAINERS] Found MCP config in preset:', preset.config.mcpConfig)
        containerConfig.mcpConfig = preset.config.mcpConfig
      } else {
        console.log('[CONTAINERS] No MCP config found in preset')
      }
      
      // Add preset name to container name
      containerConfig.name = `${preset.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    }
    
    console.log('[CONTAINERS] Final container configuration being sent:', containerConfig)
    console.log('[CONTAINERS] Model in config:', containerConfig.model)
    console.log('[CONTAINERS] System prompt in config:', containerConfig.systemPrompt)
    console.log('[CONTAINERS] MCP config in config:', containerConfig.mcpConfig)
    
    // Verify what we're actually sending
    const requestBody = JSON.stringify(containerConfig)
    console.log('[CONTAINERS] Actual JSON being sent to API:', requestBody)
    
    const response = await fetch(`${API_BASE}/api/docker/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('[CONTAINERS] Container created successfully:', result)
      await refreshContainers()
    } else {
      const errorData = await response.json()
      console.error('[CONTAINERS] Failed to create container:', errorData)
      alert(`Failed to create container: ${errorData.error}`)
    }
  } catch (error) {
    console.error('Failed to create container:', error)
    alert(`Failed to create container: ${error.message}`)
  } finally {
    creatingContainer.value = false
  }
}

const startContainer = async (id: string) => {
  try {
    startingIndividualContainers.value.add(id)
    await fetch(`${API_BASE}/api/docker/containers/${id}/start`, { method: 'POST' })
    await refreshContainers()
  } catch (error) {
    console.error('Failed to start container:', error)
  } finally {
    startingIndividualContainers.value.delete(id)
  }
}

const stopContainer = async (id: string) => {
  try {
    stoppingIndividualContainers.value.add(id)
    await fetch(`${API_BASE}/api/docker/containers/${id}/stop`, { method: 'POST' })
    await refreshContainers()
  } catch (error) {
    console.error('Failed to stop container:', error)
  } finally {
    stoppingIndividualContainers.value.delete(id)
  }
}

const removeContainer = async (id: string) => {
  if (!confirm('Are you sure you want to remove this container?')) return
  
  try {
    removingIndividualContainers.value.add(id)
    await fetch(`${API_BASE}/api/docker/containers/${id}`, { method: 'DELETE' })
    await refreshContainers()
  } catch (error) {
    console.error('Failed to remove container:', error)
  } finally {
    removingIndividualContainers.value.delete(id)
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running': return 'bg-green-100 text-green-800'
    case 'exited': return 'bg-gray-100 text-gray-800'
    case 'created': return 'bg-blue-100 text-blue-800'
    case 'paused': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (date: string | number) => {
  if (typeof date === 'number') {
    return new Date(date * 1000).toLocaleString()
  }
  return new Date(date).toLocaleString()
}

// Helper functions to handle Docker API format differences
const getContainerId = (container: Container): string => {
  return container.Id || container.id || 'unknown'
}

const getContainerName = (container: Container): string => {
  if (container.Names && container.Names.length > 0) {
    // Docker API returns names with leading slash
    return container.Names[0].replace(/^\//, '')
  }
  return container.name || getContainerId(container).substring(0, 12)
}

const getContainerStatus = (container: Container): string => {
  return container.State || container.status || container.Status || 'unknown'
}

// Selection management
const allSelected = computed(() => {
  return containers.value.length > 0 && selectedContainers.value.size === containers.value.length
})

const isSelected = (container: Container): boolean => {
  return selectedContainers.value.has(getContainerId(container))
}

const toggleSelection = (container: Container) => {
  const id = getContainerId(container)
  if (selectedContainers.value.has(id)) {
    selectedContainers.value.delete(id)
  } else {
    selectedContainers.value.add(id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedContainers.value.clear()
  } else {
    selectedContainers.value.clear()
    containers.value.forEach(container => {
      selectedContainers.value.add(getContainerId(container))
    })
  }
}

const startSelectedContainers = async () => {
  if (selectedContainers.value.size === 0) return
  
  const stoppedContainers = Array.from(selectedContainers.value).filter(id => {
    const container = containers.value.find(c => getContainerId(c) === id)
    return container && getContainerStatus(container).toLowerCase() === 'exited'
  })
  
  if (stoppedContainers.length === 0) {
    alert('No stopped containers selected')
    return
  }
  
  const confirmed = confirm(`Start ${stoppedContainers.length} stopped container(s)?`)
  if (!confirmed) return
  
  try {
    startingSelectedContainers.value = true
    const results = await Promise.allSettled(
      stoppedContainers.map(id => 
        fetch(`${API_BASE}/api/docker/containers/${id}/start`, { method: 'POST' })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    await refreshContainers()
    
    if (failed > 0) {
      alert(`Started ${successful} containers. ${failed} containers failed to start.`)
    } else {
      console.log(`Successfully started ${successful} containers`)
    }
  } catch (error) {
    console.error('Failed to start containers:', error)
    alert(`Failed to start containers: ${error.message}`)
  } finally {
    startingSelectedContainers.value = false
  }
}

const stopSelectedContainers = async () => {
  if (selectedContainers.value.size === 0) return
  
  const runningContainers = Array.from(selectedContainers.value).filter(id => {
    const container = containers.value.find(c => getContainerId(c) === id)
    return container && getContainerStatus(container).toLowerCase() === 'running'
  })
  
  if (runningContainers.length === 0) {
    alert('No running containers selected')
    return
  }
  
  const confirmed = confirm(`Stop ${runningContainers.length} running container(s)?`)
  if (!confirmed) return
  
  try {
    stoppingSelectedContainers.value = true
    const results = await Promise.allSettled(
      runningContainers.map(id => 
        fetch(`${API_BASE}/api/docker/containers/${id}/stop`, { method: 'POST' })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    await refreshContainers()
    
    if (failed > 0) {
      alert(`Stopped ${successful} containers. ${failed} containers failed to stop.`)
    } else {
      console.log(`Successfully stopped ${successful} containers`)
    }
  } catch (error) {
    console.error('Failed to stop containers:', error)
    alert(`Failed to stop containers: ${error.message}`)
  } finally {
    stoppingSelectedContainers.value = false
  }
}

const deleteSelectedContainers = async () => {
  if (selectedContainers.value.size === 0) return
  
  const confirmed = confirm(`Are you sure you want to delete ${selectedContainers.value.size} container(s)?`)
  if (!confirmed) return
  
  try {
    deletingSelectedContainers.value = true
    const containerIds = Array.from(selectedContainers.value)
    
    const response = await fetch(`${API_BASE}/api/docker/containers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ containerIds })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      selectedContainers.value.clear()
      await refreshContainers()
      
      if (result.failed && result.failed.length > 0) {
        console.warn('Some containers failed to delete:', result.failed)
        alert(`Successfully deleted ${result.removed.length} containers. ${result.failed.length} containers failed to delete.`)
      }
    } else {
      throw new Error(result.error || 'Failed to delete containers')
    }
  } catch (error) {
    console.error('Failed to delete containers:', error)
    alert(`Failed to delete containers: ${error.message}`)
  } finally {
    deletingSelectedContainers.value = false
  }
}

// Helper function to get container model from labels
const getContainerModel = (container: Container): string | null => {
  const labels = container.Labels || container.DetailedConfig?.Labels || container.labels || {}
  return labels['claude.model'] || null
}

// Helper function to check if container has MCP config
const containerHasMcp = (container: Container): boolean => {
  const labels = container.Labels || container.DetailedConfig?.Labels || container.labels || {}
  return !!labels['claude.mcpConfig']
}

// Function to show container configuration
const showContainerConfig = (container: Container) => {
  try {
    // Extract configuration from container data and labels
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
    config.name = getContainerName(container)
    config.status = getContainerStatus(container)
    
    // Add created date
    if (container.Created || container.created) {
      config.created = formatDate(container.Created || container.created)
    }
    
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
    alert('Failed to show container configuration')
  }
}

// Initialize on mount
onMounted(async () => {
  console.log('[CONTAINERS] Page mounted, initializing...')
  initializePresets()
  
  // Wait a moment for presets to load from localStorage
  await nextTick()
  
  console.log('[CONTAINERS] After initialization - presets:', presets.value.map(p => p.id))
  console.log('[CONTAINERS] Current selectedPresetId:', selectedPresetId.value)
  
  // Add MCP config to any preset that doesn't have it
  let presetsUpdated = false
  presets.value.forEach(preset => {
    if (!preset.config.mcpConfig) {
      console.log(`[CONTAINERS] Adding MCP config to preset: ${preset.name}`)
      preset.config.mcpConfig = {
        mcpServers: {
          exa: {
            command: "npx",
            args: [
              "-y",
              "@smithery/cli@latest",
              "run",
              "exa",
              "--key",
              "20f79417-8898-4f2e-9356-3265d2c11e40"
            ]
          }
        }
      }
      updatePreset(preset.id, preset)
      presetsUpdated = true
    }
  })
  
  if (presetsUpdated) {
    console.log('[CONTAINERS] Updated presets with MCP config')
  }
  
  // Select default preset if none selected
  if (!selectedPresetId.value && presets.value.length > 0) {
    const defaultPreset = presets.value.find(p => p.id === 'default') || presets.value[0]
    if (defaultPreset) {
      selectedPresetId.value = defaultPreset.id
      console.log('[CONTAINERS] Auto-selected default preset:', defaultPreset.id)
    }
  }
  
  console.log('[CONTAINERS] Final selectedPresetId:', selectedPresetId.value)
  
  refreshContainers()
})
</script>