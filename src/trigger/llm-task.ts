import { task } from '@trigger.dev/sdk/v3'
import Groq from 'groq-sdk'

interface LLMTaskPayload {
  model: string
  systemPrompt?: string
  userMessage: string
  imageUrls?: string[]
  nodeId: string
  workflowRunId: string
}

export const llmTask = task({
  id: 'llm-task',
  retry: { maxAttempts: 1 },
  run: async (payload: LLMTaskPayload) => {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

      const messages: any[] = []

      if (payload.systemPrompt) {
        messages.push({ role: 'system', content: payload.systemPrompt })
      }

      // Build user message content
      const userContent: any[] = []

      // Add images if provided (vision support)
      if (payload.imageUrls && payload.imageUrls.length > 0) {
        for (const imageUrl of payload.imageUrls) {
          userContent.push({
            type: 'image_url',
            image_url: { url: imageUrl }
          })
        }
      }

      userContent.push({ type: 'text', text: payload.userMessage })

      messages.push({
        role: 'user',
        content: payload.imageUrls?.length ? userContent : payload.userMessage
      })

      // Use vision model if images present, otherwise fast text model
      const modelToUse = payload.imageUrls?.length
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile'
      const completion = await groq.chat.completions.create({
        model: modelToUse,
        messages,
        max_tokens: 1024,
      })

      const text = completion.choices[0]?.message?.content || ''

      return {
        output: text,
        nodeId: payload.nodeId,
        workflowRunId: payload.workflowRunId,
      }

    } catch (error: any) {
      console.error('Groq error, using fallback:', error.message)

      // Fallback mock responses
      let mockOutput = 'This is a demonstration of NextFlow LLM integration.'

      if (payload.systemPrompt?.toLowerCase().includes('marketing') ||
          payload.systemPrompt?.toLowerCase().includes('product')) {
        mockOutput = 'Introducing our premium Wireless Bluetooth Headphones — where cutting-edge noise cancellation meets 30-hour battery life. Engineered for the modern professional, these foldable headphones deliver crystal-clear audio and unmatched comfort for all-day wear.'
      } else if (payload.systemPrompt?.toLowerCase().includes('tweet') ||
                 payload.systemPrompt?.toLowerCase().includes('social')) {
        mockOutput = '🎧 Introducing the future of sound! Our Wireless BT Headphones deliver 30hrs of pure audio bliss with industry-leading noise cancellation. Work smarter, sound better. #TechLife #AudioPro'
      }

      return {
        output: `[Demo] ${mockOutput}`,
        nodeId: payload.nodeId,
        workflowRunId: payload.workflowRunId,
      }
    }
  }
})
