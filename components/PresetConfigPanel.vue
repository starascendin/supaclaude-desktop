<template>
  <Sheet v-model:open="isConfigPanelOpen">
    <SheetContent side="right" class="w-96 overflow-hidden flex flex-col p-0">
      <SheetHeader class="p-4 border-b border-gray-200 bg-gray-50">
        <SheetTitle>
          {{ editingPreset?.id ? 'Edit Preset' : 'New Preset' }}
        </SheetTitle>
        <SheetDescription>
          Configure Claude SDK container settings
        </SheetDescription>
      </SheetHeader>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Basic Info -->
        <div class="space-y-4">
          <h3 class="font-medium text-gray-900">Basic Information</h3>
          
          <div class="space-y-2">
            <Label for="preset-name">
              Preset Name <span class="text-red-500">*</span>
            </Label>
            <Input
              id="preset-name"
              v-model="editingPreset!.name"
              placeholder="e.g., My Custom Preset"
            />
          </div>

          <div class="space-y-2">
            <Label for="preset-description">
              Description
            </Label>
            <Textarea
              id="preset-description"
              v-model="editingPreset!.description"
              placeholder="Optional description of this preset..."
              :rows="2"
            />
          </div>
        </div>

        <!-- Claude Configuration -->
        <div class="space-y-4">
          <h3 class="font-medium text-gray-900">Claude Configuration</h3>
          
          <div class="space-y-2">
            <Label>
              Model
            </Label>
            <RadioGroup 
              v-model="editingPreset!.config.model" 
              class="flex gap-6"
            >
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="sonnet" id="model-sonnet" />
                <Label for="model-sonnet" class="text-sm font-normal cursor-pointer">Sonnet</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="opus" id="model-opus" />
                <Label for="model-opus" class="text-sm font-normal cursor-pointer">Opus</Label>
              </div>
            </RadioGroup>
            <p class="text-xs text-gray-500">
              Choose the Claude model to use for this container
            </p>
          </div>
          
          <div class="space-y-2">
            <Label for="system-prompt">
              System Prompt
            </Label>
            <Textarea
              id="system-prompt"
              v-model="editingPreset!.config.systemPrompt"
              placeholder="You are a helpful assistant..."
              :rows="4"
            />
            <p class="text-xs text-gray-500">
              This will be passed to Claude SDK via --system-prompt flag
            </p>
          </div>
        </div>

        <!-- Container Configuration -->
        <div class="space-y-4">
          <h3 class="font-medium text-gray-900">Container Configuration</h3>
          
          <div class="space-y-2">
            <Label for="docker-image">
              Docker Image
            </Label>
            <Input
              id="docker-image"
              v-model="editingPreset!.config.image"
              placeholder="ghcr.io/starascendin/cldauthed-python"
            />
          </div>

          <div class="space-y-2">
            <Label for="working-dir">
              Working Directory
            </Label>
            <Input
              id="working-dir"
              v-model="editingPreset!.config.workingDir"
              placeholder="/workspace"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label for="memory-limit">
                Memory Limit
              </Label>
              <Input
                id="memory-limit"
                v-model="editingPreset!.config.memory"
                placeholder="512m"
              />
            </div>
            <div class="space-y-2">
              <Label for="cpu-limit">
                CPU Limit
              </Label>
              <Input
                id="cpu-limit"
                v-model="editingPreset!.config.cpus"
                type="number"
                step="0.1"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        <!-- Environment Variables -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900">Environment Variables</h3>
            <button
              @click="addEnvironmentVariable"
              class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Variable
            </button>
          </div>

          <div v-if="environmentVariables.length === 0" class="text-sm text-gray-500 italic">
            No environment variables configured
          </div>

          <div v-for="(envVar, index) in environmentVariables" :key="index" class="flex gap-2">
            <Input
              v-model="envVar.key"
              placeholder="KEY"
              class="flex-1"
            />
            <Input
              v-model="envVar.value"
              placeholder="value"
              class="flex-1"
            />
            <Button
              @click="removeEnvironmentVariable(index)"
              variant="outline"
              size="icon"
              class="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        <!-- Volumes -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900">Volume Mounts</h3>
            <button
              @click="addVolume"
              class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Volume
            </button>
          </div>

          <div v-if="volumes.length === 0" class="text-sm text-gray-500 italic">
            No volume mounts configured
          </div>

          <div v-for="(volume, index) in volumes" :key="index" class="flex gap-2">
            <Input
              v-model="volumes[index]"
              placeholder="/host/path:/container/path"
              class="flex-1"
            />
            <Button
              @click="removeVolume(index)"
              variant="outline"
              size="icon"
              class="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        <!-- MCP Configuration -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900">MCP Configuration</h3>
            <button
              @click="toggleMcpConfig"
              class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ hasMcpConfig ? 'Remove MCP' : 'Add MCP' }}
            </button>
          </div>

          <div v-if="hasMcpConfig" class="space-y-2">
            <Label for="mcp-config">
              MCP Servers JSON
            </Label>
            <Textarea
              id="mcp-config"
              v-model="mcpJsonString"
              placeholder='{"mcpServers":{"exa":{"command":"npx","args":["-y","@smithery/cli@latest","run","exa","--key","your-key"]}}}'
              :rows="8"
              class="font-mono text-xs"
            />
            <p class="text-xs text-gray-500">
              This will create a .mcp.json file in the container for Claude to use MCP servers
            </p>
            <div v-if="mcpJsonError" class="text-xs text-red-600">
              {{ mcpJsonError }}
            </div>
          </div>
        </div>

        <!-- YAML Preview -->
        <div class="space-y-4">
          <h3 class="font-medium text-gray-900">Docker Configuration Preview</h3>
          
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-700">YAML Configuration</span>
              <span class="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Read-only
              </span>
            </div>
            <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{{ yamlPreview }}</pre>
          </div>
          
          <p class="text-xs text-gray-500">
            This configuration will be used when creating Docker containers with this preset.
          </p>
        </div>
      </div>

      <SheetFooter class="border-t border-gray-200 p-4 bg-gray-50">
        <div class="flex gap-3 w-full">
          <Button
            @click="saveEditingPreset"
            :disabled="!canSave"
            class="flex-1"
          >
            {{ editingPreset?.id ? 'Update Preset' : 'Create Preset' }}
          </Button>
          <Button
            @click="closeConfigPanel"
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContainerPresets } from '~/composables/useContainerPresets'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const {
  isConfigPanelOpen,
  editingPreset,
  closeConfigPanel,
  saveEditingPreset,
  presetToYaml,
  initialize
} = useContainerPresets()

// Environment variables as reactive array
const environmentVariables = ref<Array<{key: string, value: string}>>([])

// Volumes as reactive array
const volumes = ref<string[]>([])

// MCP configuration
const mcpJsonString = ref('')
const mcpJsonError = ref('')

// Watch for changes in editing preset to update local arrays
watch(editingPreset, (newPreset) => {
  console.log('[PRESET_CONFIG_PANEL] Editing preset changed:', newPreset)
  if (newPreset) {
    // Update environment variables
    environmentVariables.value = newPreset.config.environment
      ? Object.entries(newPreset.config.environment).map(([key, value]) => ({ key, value }))
      : []
    
    // Update volumes
    volumes.value = newPreset.config.volumes ? [...newPreset.config.volumes] : []
    
    // Update MCP config
    mcpJsonString.value = newPreset.config.mcpConfig ? JSON.stringify(newPreset.config.mcpConfig, null, 2) : ''
  }
}, { immediate: true, deep: true })

// Watch for panel open state
watch(isConfigPanelOpen, (isOpen) => {
  console.log('[PRESET_CONFIG_PANEL] Panel open state changed:', isOpen)
})

// Watch for changes in local arrays to update editing preset
watch([environmentVariables, volumes], () => {
  if (editingPreset.value) {
    // Update environment object
    const envObj: Record<string, string> = {}
    environmentVariables.value.forEach(({ key, value }) => {
      if (key.trim()) {
        envObj[key.trim()] = value
      }
    })
    editingPreset.value.config.environment = Object.keys(envObj).length > 0 ? envObj : undefined
    
    // Update volumes array
    editingPreset.value.config.volumes = volumes.value.filter(v => v.trim()).length > 0 
      ? volumes.value.filter(v => v.trim()) 
      : undefined
  }
}, { deep: true })

// Watch for MCP JSON changes
watch(mcpJsonString, (newValue) => {
  if (!editingPreset.value) return
  
  mcpJsonError.value = ''
  
  if (!newValue.trim()) {
    editingPreset.value.config.mcpConfig = undefined
    return
  }
  
  try {
    const parsed = JSON.parse(newValue)
    // Validate the structure
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
      mcpJsonError.value = 'JSON must have "mcpServers" object at root level'
      return
    }
    
    // Validate each server config
    for (const [serverName, config] of Object.entries(parsed.mcpServers)) {
      if (!config || typeof config !== 'object') {
        mcpJsonError.value = `Server "${serverName}" must be an object`
        return
      }
      const serverConfig = config as any
      if (!serverConfig.command || typeof serverConfig.command !== 'string') {
        mcpJsonError.value = `Server "${serverName}" must have a "command" string`
        return
      }
      if (!serverConfig.args || !Array.isArray(serverConfig.args)) {
        mcpJsonError.value = `Server "${serverName}" must have an "args" array`
        return
      }
    }
    
    editingPreset.value.config.mcpConfig = parsed
  } catch (error) {
    mcpJsonError.value = 'Invalid JSON format'
  }
})

const canSave = computed(() => {
  return editingPreset.value?.name?.trim().length > 0 && !mcpJsonError.value
})

const hasMcpConfig = computed(() => {
  return !!editingPreset.value?.config.mcpConfig
})

const yamlPreview = computed(() => {
  if (!editingPreset.value) return ''
  return presetToYaml(editingPreset.value)
})

const addEnvironmentVariable = () => {
  environmentVariables.value.push({ key: '', value: '' })
}

const removeEnvironmentVariable = (index: number) => {
  environmentVariables.value.splice(index, 1)
}

const addVolume = () => {
  volumes.value.push('')
}

const removeVolume = (index: number) => {
  volumes.value.splice(index, 1)
}

const toggleMcpConfig = () => {
  if (!editingPreset.value) return
  
  if (editingPreset.value.config.mcpConfig) {
    editingPreset.value.config.mcpConfig = undefined
    mcpJsonString.value = ''
    mcpJsonError.value = ''
  } else {
    const defaultMcpConfig = {
      mcpServers: {
        exa: {
          command: "npx",
          args: [
            "-y",
            "@smithery/cli@latest",
            "run",
            "exa",
            "--key",
            "your-api-key"
          ]
        }
      }
    }
    mcpJsonString.value = JSON.stringify(defaultMcpConfig, null, 2)
  }
}
</script>