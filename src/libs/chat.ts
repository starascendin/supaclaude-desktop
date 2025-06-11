import { ref, nextTick } from 'vue'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'start' | 'thinking' | 'content' | 'end' | 'assistant'
}

export const useChat = () => {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const currentModel = ref('claude-3-sonnet')
  const scrollContainer = ref<HTMLElement>()

  const scrollToBottom = async () => {
    await nextTick()
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  }

  const sendMessage = async (content: string, context?: any) => {
    console.log('[CHAT] Sending message:', content)
    
    // Add user message
    messages.value.push({ role: 'user', content })
    await scrollToBottom()

    // Start streaming
    isStreaming.value = true

    try {
      // Prepare messages for API
      const apiMessages = messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      console.log('[CHAT] Prepared messages for API:', apiMessages)
      console.log('[CHAT] Context:', context)

      // Prepare request body
      const requestBody: any = {
        messages: apiMessages
      }

      // Add execution mode and container context if provided
      if (context?.executionMode) {
        requestBody.executionMode = context.executionMode
      }
      if (context?.containerId) {
        requestBody.containerId = context.containerId
      }
      if (context?.systemPrompt) {
        requestBody.systemPrompt = context.systemPrompt
      }

      // Call API with streaming
      console.log('[CHAT] Calling API endpoint...')
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('[CHAT] API response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CHAT] API error response:', errorText)
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`)
      }

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }
      
      console.log('[CHAT] Starting stream reading...')

      let totalChunks = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[CHAT] Stream reading completed')
          break
        }

        const chunk = decoder.decode(value)
        totalChunks++
        console.log(`[CHAT] Received chunk #${totalChunks}:`, chunk.length, 'bytes')
        
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              console.log('[CHAT] Parsed SSE data:', data)
              
              // Handle Claude CLI events
              if (data.type === 'assistant' && data.message) {
                const content = data.message.content?.[0]?.text || ''
                if (content) {
                  messages.value.push({
                    role: 'assistant',
                    content,
                    type: 'assistant'
                  })
                  console.log('[CHAT] Added assistant message, length:', content.length)
                  await scrollToBottom()
                }
              } else if (data.type === 'content' || data.type === 'start' || data.type === 'thinking' || data.type === 'end') {
                messages.value.push({
                  role: 'assistant',
                  content: data.content || '',
                  type: data.type
                })
                console.log('[CHAT] Added event message:', data.type)
                await scrollToBottom()
              } else if (data.type === 'system') {
                console.log('[CHAT] System event:', data.subtype)
              } else if (data.error) {
                console.error('[CHAT] Stream error:', data.error)
              } else if (data.done) {
                console.log('[CHAT] Stream completed signal received')
              } else {
                console.log('[CHAT] Other event:', data.type)
              }
            } catch (e) {
              console.warn('[CHAT] Failed to parse SSE line:', line, e)
            }
          }
        }
      }
    } catch (error) {
      console.error('[CHAT] Chat error:', error)
      messages.value.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      })
    } finally {
      console.log('[CHAT] Cleaning up - setting streaming to false')
      isStreaming.value = false
      await scrollToBottom()
    }
  }

  return {
    messages,
    isStreaming,
    currentModel,
    scrollContainer,
    sendMessage
  }
} 