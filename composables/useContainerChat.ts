import { ref, nextTick } from 'vue'

export interface ContainerMessage {
  role: 'user' | 'assistant'
  content: string
  type?: 'start' | 'thinking' | 'content' | 'end' | 'assistant'
  timestamp?: string
  uuid?: string
  sessionId?: string
  executionInfo?: {
    containerId: string
    command?: string
    exitCode?: number
  }
}

export interface ContainerChatContext {
  containerId: string
  containerStatus: string
  containerLogs?: string[]
}

export const useContainerChat = (context: ContainerChatContext) => {
  const messages = ref<ContainerMessage[]>([])
  const isStreaming = ref(false)
  const scrollContainer = ref<HTMLElement>()
  const onSessionCreated = ref<(() => void) | null>(null)

  const scrollToBottom = async () => {
    await nextTick()
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  }

  const sendCommand = async (content: string, options?: { continueThread?: boolean, sessionId?: string, systemPrompt?: string }) => {
    console.log('[CONTAINER_CHAT] Sending command:', content)
    console.log('[CONTAINER_CHAT] Context:', context)
    console.log('[CONTAINER_CHAT] Options:', options)
    
    // Add user message
    messages.value.push({ role: 'user', content })
    await scrollToBottom()

    // Start streaming
    isStreaming.value = true
    const isResuming = options?.continueThread && options.sessionId

    try {
      // Prepare messages for API with container context
      const apiMessages = messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Always use docker execution mode for container chat
      const requestBody = {
        messages: apiMessages,
        executionMode: 'docker',
        containerId: context.containerId,
        ...(options?.continueThread && options.sessionId && { resumeSessionId: options.sessionId }),
        ...(options?.systemPrompt && { systemPrompt: options.systemPrompt })
      }

      console.log('[CONTAINER_CHAT] Request body:', requestBody)

      // Call API with streaming
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CONTAINER_CHAT] API error:', errorText)
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`)
      }

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let currentMessage: ContainerMessage | null = null
      let commandExecuted = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              console.log('[CONTAINER_CHAT] SSE data:', data)
              
              // Handle different event types
              if (data.type === 'assistant' && data.message) {
                // Full message from Claude SDK
                const content = data.message.content?.[0]?.text || data.message.content || ''
                if (content) {
                  // Don't add a new message if we're already building one
                  if (!currentMessage || currentMessage.type !== 'content') {
                    currentMessage = {
                      role: 'assistant',
                      content,
                      type: 'assistant'
                    }
                    messages.value.push(currentMessage)
                    await scrollToBottom()
                  }
                }
              } else if (data.type === 'content' && data.content) {
                // Streaming content chunk
                if (!currentMessage || currentMessage.type === 'thinking' || currentMessage.type === 'start') {
                  // Start a new message
                  currentMessage = {
                    role: 'assistant',
                    content: data.content,
                    type: 'content'
                  }
                  messages.value.push(currentMessage)
                } else {
                  // Append to existing message
                  currentMessage.content += data.content
                }
                await scrollToBottom()
              } else if (data.type === 'execution_start') {
                // Track that a command is being executed
                commandExecuted = true
                console.log('[CONTAINER_CHAT] Command execution started')
              } else if (data.type === 'execution_result') {
                // Update the last message with execution result
                if (currentMessage && data.exitCode !== undefined) {
                  currentMessage.executionInfo = {
                    containerId: context.containerId,
                    command: data.command,
                    exitCode: data.exitCode
                  }
                }
              } else if (data.type === 'start') {
                // Start of response
                messages.value.push({
                  role: 'assistant',
                  content: 'Starting...',
                  type: 'start'
                })
                await scrollToBottom()
              } else if (data.type === 'thinking') {
                // Thinking indicator
                messages.value.push({
                  role: 'assistant',
                  content: '',
                  type: 'thinking'
                })
                await scrollToBottom()
              } else if (data.type === 'end') {
                // End of response - remove any temporary messages
                messages.value = messages.value.filter(m => 
                  m.type !== 'start' && m.type !== 'thinking'
                )
                console.log('[CONTAINER_CHAT] Response complete')
              } else if (data.type === 'error' && data.content) {
                console.error('[CONTAINER_CHAT] Stream error:', data.content)
                messages.value.push({
                  role: 'assistant',
                  content: `Error: ${data.content}`
                })
                await scrollToBottom()
              } else if (data.error) {
                console.error('[CONTAINER_CHAT] Stream error:', data.error)
                messages.value.push({
                  role: 'assistant',
                  content: typeof data.error === 'string' ? data.error : 'An error occurred'
                })
                await scrollToBottom()
              }
            } catch (e) {
              console.warn('[CONTAINER_CHAT] Failed to parse SSE line:', line, e)
            }
          }
        }
      }
    } catch (error) {
      console.error('[CONTAINER_CHAT] Error:', error)
      messages.value.push({
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to send command'}`
      })
    } finally {
      isStreaming.value = false
      await scrollToBottom()
      
      // If we were resuming a thread, trigger callback to refresh sessions
      if (isResuming && onSessionCreated.value) {
        console.log('[CONTAINER_CHAT] Triggering session refresh after resume')
        setTimeout(() => {
          onSessionCreated.value?.()
        }, 1000) // Small delay to ensure new session file is created
      }
    }
  }

  // Container-specific operations
  const clearMessages = () => {
    messages.value = []
  }

  const addSystemMessage = (content: string) => {
    messages.value.push({
      role: 'assistant',
      content,
      type: 'content'
    })
    scrollToBottom()
  }

  const loadSessionMessages = async (sessionId: string) => {
    try {
      console.log('[CONTAINER_CHAT] Loading session file:', sessionId)
      const response = await fetch(`http://localhost:8000/api/docker/containers/${context.containerId}/sessions/${sessionId}`)
      const data = await response.json()
      
      if (data.messages) {
        console.log('[CONTAINER_CHAT] Loaded', data.messages.length, 'messages from session file')
        
        // Map the session messages with all metadata
        messages.value = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          type: 'content',
          timestamp: msg.timestamp,
          uuid: msg.uuid,
          sessionId: msg.sessionId
        }))
        
        // Add a system message showing what was loaded
        addSystemMessage(`Loaded session file: ${sessionId.substring(0, 8)}`)
        
        await scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to load session messages:', error)
      addSystemMessage(`Error loading session: ${error.message}`)
    }
  }

  return {
    messages,
    isStreaming,
    scrollContainer,
    sendCommand,
    clearMessages,
    addSystemMessage,
    loadSessionMessages,
    onSessionCreated
  }
}