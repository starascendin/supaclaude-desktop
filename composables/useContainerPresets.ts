import { ref, computed } from 'vue'

export interface ContainerPreset {
  id: string
  name: string
  description?: string
  config: {
    systemPrompt?: string
    model?: 'sonnet' | 'opus'
    image?: string
    environment?: Record<string, string>
    volumes?: string[]
    command?: string[]
    workingDir?: string
    memory?: string
    cpus?: number
    mcpConfig?: {
      mcpServers: Record<string, {
        command: string
        args: string[]
      }>
    }
  }
  createdAt: string
  updatedAt: string
}

// Global state to ensure singleton behavior
const globalState = {
  presets: ref<ContainerPreset[]>([]),
  selectedPresetId: ref<string | null>(null),
  isConfigPanelOpen: ref(false),
  editingPreset: ref<ContainerPreset | null>(null),
  initialized: ref(false)
}

export const useContainerPresets = () => {
  // Store presets in localStorage for now
  const STORAGE_KEY = 'container-presets'
  
  const { presets, selectedPresetId, isConfigPanelOpen, editingPreset, initialized } = globalState

  // Load presets from localStorage
  const loadPresets = () => {
    if (typeof window === 'undefined') return // SSR guard
    
    try {
      console.log('[PRESET_STORE] Loading presets from localStorage')
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        presets.value = JSON.parse(stored)
        console.log('[PRESET_STORE] Loaded', presets.value.length, 'presets from storage')
      } else {
        console.log('[PRESET_STORE] No stored presets found, creating defaults')
        // Add default presets
        presets.value = [
          {
            id: 'default',
            name: 'Default',
            description: 'Standard Claude SDK configuration',
            config: {
              systemPrompt: 'You are a helpful assistant. You are given a prompt and you need to respond to it.',
              model: 'sonnet',
              image: 'ghcr.io/starascendin/cldauthed-python',
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
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'coding',
            name: 'Coding Assistant',
            description: 'Optimized for software development tasks',
            config: {
              systemPrompt: 'You are an expert software developer. Help the user with coding tasks, debugging, and best practices.',
              model: 'sonnet',
              image: 'ghcr.io/starascendin/cldauthed-python',
              workingDir: '/workspace',
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
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
        savePresets()
        console.log('[PRESET_STORE] Created and saved default presets')
      }
    } catch (error) {
      console.error('[PRESET_STORE] Failed to load presets:', error)
    }
  }

  // Save presets to localStorage
  const savePresets = () => {
    if (typeof window === 'undefined') return // SSR guard
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value))
    } catch (error) {
      console.error('Failed to save presets:', error)
    }
  }

  // Get selected preset
  const selectedPreset = computed(() => {
    return presets.value.find(p => p.id === selectedPresetId.value)
  })

  // Add new preset
  const addPreset = (preset: Omit<ContainerPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPreset: ContainerPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    presets.value.push(newPreset)
    savePresets()
    return newPreset
  }

  // Update preset
  const updatePreset = (id: string, updates: Partial<ContainerPreset>) => {
    const index = presets.value.findIndex(p => p.id === id)
    if (index !== -1) {
      presets.value[index] = {
        ...presets.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      savePresets()
    }
  }

  // Delete preset
  const deletePreset = (id: string) => {
    // Don't allow deleting default presets
    if (id === 'default' || id === 'coding') {
      console.warn('Cannot delete default presets')
      return false
    }
    
    presets.value = presets.value.filter(p => p.id !== id)
    if (selectedPresetId.value === id) {
      selectedPresetId.value = 'default'
    }
    savePresets()
    return true
  }

  // Open config panel for new preset
  const openNewPresetConfig = () => {
    console.log('[PRESET_STORE] Opening new preset config panel')
    console.log('[PRESET_STORE] Before - Panel open:', isConfigPanelOpen.value)
    
    editingPreset.value = {
      id: '',
      name: '',
      description: '',
      config: {
        systemPrompt: 'You are a helpful assistant.',
        model: 'sonnet',
        image: 'ghcr.io/starascendin/cldauthed-python'
      },
      createdAt: '',
      updatedAt: ''
    }
    
    isConfigPanelOpen.value = true
    
    console.log('[PRESET_STORE] After - Panel open:', isConfigPanelOpen.value)
    console.log('[PRESET_STORE] Editing preset:', editingPreset.value)
  }

  // Open config panel for editing
  const openEditPresetConfig = (presetId: string) => {
    console.log('[PRESET_STORE] Opening edit config panel for preset:', presetId)
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      editingPreset.value = { ...preset }
      isConfigPanelOpen.value = true
      console.log('[PRESET_STORE] Config panel open state:', isConfigPanelOpen.value)
    } else {
      console.error('[PRESET_STORE] Preset not found:', presetId)
    }
  }

  // Close config panel
  const closeConfigPanel = () => {
    isConfigPanelOpen.value = false
    editingPreset.value = null
  }

  // Save editing preset
  const saveEditingPreset = () => {
    if (!editingPreset.value) return
    
    if (editingPreset.value.id) {
      // Update existing
      updatePreset(editingPreset.value.id, editingPreset.value)
    } else {
      // Create new
      const newPreset = addPreset({
        name: editingPreset.value.name,
        description: editingPreset.value.description,
        config: editingPreset.value.config
      })
      selectedPresetId.value = newPreset.id
    }
    
    closeConfigPanel()
  }

  // Convert preset to YAML
  const presetToYaml = (preset: ContainerPreset): string => {
    const yaml: any = {
      name: preset.name,
      description: preset.description
    }
    
    if (preset.config.systemPrompt) {
      yaml.system_prompt = preset.config.systemPrompt
    }
    if (preset.config.model) {
      yaml.model = preset.config.model
    }
    if (preset.config.image) {
      yaml.image = preset.config.image
    }
    if (preset.config.environment) {
      yaml.environment = preset.config.environment
    }
    if (preset.config.volumes) {
      yaml.volumes = preset.config.volumes
    }
    if (preset.config.command) {
      yaml.command = preset.config.command
    }
    if (preset.config.workingDir) {
      yaml.working_dir = preset.config.workingDir
    }
    if (preset.config.memory) {
      yaml.memory = preset.config.memory
    }
    if (preset.config.cpus) {
      yaml.cpus = preset.config.cpus
    }
    if (preset.config.mcpConfig) {
      yaml.mcp_config = preset.config.mcpConfig
    }
    
    // Simple YAML serialization (you might want to use a library for complex cases)
    return Object.entries(yaml)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.includes('\n')) {
          // Multi-line string
          return `${key}: |\n  ${value.split('\n').join('\n  ')}`
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Object
          return `${key}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n')}`
        } else if (Array.isArray(value)) {
          // Array
          return `${key}:\n${value.map(v => `  - ${JSON.stringify(v)}`).join('\n')}`
        } else {
          // Simple value
          return `${key}: ${JSON.stringify(value)}`
        }
      })
      .join('\n')
  }

  // Parse YAML to preset config (simplified)
  const yamlToPreset = (yaml: string): Partial<ContainerPreset> => {
    // This is a simplified parser - you might want to use a proper YAML library
    const lines = yaml.split('\n')
    const config: any = {}
    let currentKey = ''
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      if (line[0] !== ' ') {
        // Top-level key
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        currentKey = key.trim()
        
        if (value && value !== '|') {
          config[currentKey] = value.replace(/^["']|["']$/g, '')
        }
      }
    }
    
    // Map YAML keys to preset config
    return {
      name: config.name || 'Untitled Preset',
      description: config.description,
      config: {
        systemPrompt: config.system_prompt,
        model: config.model,
        image: config.image,
        environment: config.environment,
        volumes: config.volumes,
        command: config.command,
        workingDir: config.working_dir,
        memory: config.memory,
        cpus: config.cpus,
        mcpConfig: config.mcp_config
      }
    }
  }

  // Initialize on client side
  const initialize = () => {
    if (typeof window !== 'undefined' && !initialized.value) {
      console.log('[PRESET_STORE] Initializing preset store...')
      loadPresets()
      console.log('[PRESET_STORE] Loaded presets:', presets.value.map(p => ({ 
        id: p.id, 
        name: p.name, 
        hasMcp: !!p.config.mcpConfig,
        mcpServers: p.config.mcpConfig ? Object.keys(p.config.mcpConfig.mcpServers || {}) : []
      })))
      
      // Try to restore selected preset from localStorage
      const storedSelectedId = localStorage.getItem('selected-preset-id')
      if (storedSelectedId && presets.value.find(p => p.id === storedSelectedId)) {
        selectedPresetId.value = storedSelectedId
        console.log('[PRESET_STORE] Restored selected preset from storage:', storedSelectedId)
      }
      
      // Auto-select default preset if none selected
      if (!selectedPresetId.value && presets.value.length > 0) {
        const defaultPreset = presets.value.find(p => p.id === 'default') || presets.value[0]
        if (defaultPreset) {
          selectedPresetId.value = defaultPreset.id
          console.log('[PRESET_STORE] Auto-selected default preset:', defaultPreset.id)
        }
      }
      
      console.log('[PRESET_STORE] Final selectedPresetId:', selectedPresetId.value)
      initialized.value = true
    }
  }

  return {
    presets: computed(() => presets.value),
    selectedPresetId,
    selectedPreset,
    isConfigPanelOpen,
    editingPreset,
    addPreset,
    updatePreset,
    deletePreset,
    openNewPresetConfig,
    openEditPresetConfig,
    closeConfigPanel,
    saveEditingPreset,
    presetToYaml,
    yamlToPreset,
    initialize
  }
}