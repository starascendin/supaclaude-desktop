<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-sm font-medium">
          {{ selectedPreset ? selectedPreset.name : 'Select Preset' }}
        </span>
        <span v-if="selectedPreset && selectedPreset.config.mcpConfig" class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          MCP
        </span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="w-80">
      <!-- Header -->
      <DropdownMenuLabel class="flex items-center justify-between">
        <span>Container Presets</span>
        <Button
          @click="createNewPreset"
          size="sm"
          class="h-6 px-2 text-xs"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New
        </Button>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <!-- Preset List -->
      <div class="max-h-64 overflow-y-auto">
        <DropdownMenuItem
          v-for="preset in presets"
          :key="preset.id"
          @click="selectPreset(preset.id)"
          class="flex-col items-start py-3 cursor-pointer"
        >
          <div class="flex items-start justify-between w-full">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-medium">{{ preset.name }}</h4>
                <div
                  v-if="selectedPresetId === preset.id"
                  class="w-2 h-2 bg-blue-600 rounded-full"
                ></div>
              </div>
              <p v-if="preset.description" class="text-xs text-gray-600 mt-1">
                {{ preset.description }}
              </p>
              <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span v-if="preset.config.model" class="bg-purple-100 text-purple-700 px-2 py-1 rounded capitalize">
                  {{ preset.config.model }}
                </span>
                <span v-if="preset.config.mcpConfig" class="bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  MCP
                </span>
                <span v-if="preset.config.image" class="bg-gray-100 px-2 py-1 rounded">
                  {{ preset.config.image.split('/').pop() }}
                </span>
                <span v-if="preset.config.systemPrompt" class="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Custom Prompt
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1 ml-2">
              <Button
                @click.stop="editPreset(preset.id)"
                variant="ghost"
                size="icon"
                class="h-6 w-6"
                :title="`Edit ${preset.name}`"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                v-if="preset.id !== 'default' && preset.id !== 'coding'"
                @click.stop="deletePreset(preset.id)"
                variant="ghost"
                size="icon"
                class="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                :title="`Delete ${preset.name}`"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator />

      <!-- Footer -->
      <div class="px-2 py-2 text-xs text-gray-500">
        {{ presets.length }} preset(s) available
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useContainerPresets } from '~/composables/useContainerPresets'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  presetSelected: [presetId: string]
  createContainer: [presetId: string]
}>()

const {
  presets,
  selectedPresetId,
  selectedPreset,
  openNewPresetConfig,
  openEditPresetConfig,
  deletePreset: removePreset,
  initialize
} = useContainerPresets()

const selectPreset = (presetId: string) => {
  console.log('[PRESET_DROPDOWN] Selecting preset:', presetId)
  selectedPresetId.value = presetId
  
  // Persist selection
  if (typeof window !== 'undefined') {
    localStorage.setItem('selected-preset-id', presetId)
    console.log('[PRESET_DROPDOWN] Saved selected preset to localStorage:', presetId)
  }
  
  emit('presetSelected', presetId)
}

const createNewPreset = () => {
  console.log('[PRESET_DROPDOWN] Creating new preset')
  openNewPresetConfig()
}

const editPreset = (presetId: string) => {
  console.log('[PRESET_DROPDOWN] Editing preset:', presetId)
  openEditPresetConfig(presetId)
}

const deletePreset = (presetId: string) => {
  if (confirm('Are you sure you want to delete this preset?')) {
    removePreset(presetId)
  }
}

onMounted(() => {
  console.log('[PRESET_DROPDOWN] Component mounted, initializing...')
  initialize()
  console.log('[PRESET_DROPDOWN] Current selectedPresetId:', selectedPresetId.value)
})
</script>