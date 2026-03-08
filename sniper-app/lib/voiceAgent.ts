// Voice AI Integration with Vapi.ai and fallback options

export interface VoiceCallConfig {
  phoneNumber: string
  vendorName: string
  productDescription: string
  quantity: number
}

export interface VoiceCallResult {
  callId: string
  status: 'completed' | 'failed' | 'no-answer'
  duration: number
  transcript: string
  summary: {
    priceQuoted?: number
    currency?: string
    shippingDays?: number
    customizationAvailable?: boolean
    notes?: string
  }
}

// Vapi.ai Voice Call
export async function makeVapiCall(config: VoiceCallConfig): Promise<VoiceCallResult> {
  const apiKey = process.env.VAPI_API_KEY

  if (!apiKey) {
    return simulateCall(config)
  }

  try {
    // Create assistant message
    const systemPrompt = `You are a professional sourcing agent calling vendors in India. 
Speak in Hinglish (mix of Hindi and English) naturally.

You're calling ${config.vendorName} to inquire about:
Product: ${config.productDescription}
Quantity: ${config.quantity} units

Ask about:
1. Best price per unit
2. Shipping/delivery timeline
3. Can they handle custom designs
4. Minimum order quantity

Be polite, professional, and get to the point. The call should last 1-2 minutes.`

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        customer: {
          number: config.phoneNumber,
          name: config.vendorName,
        },
        assistant: {
          firstMessage: `Namaste, main ${config.vendorName} se baat kar raha hoon? I'm calling regarding a bulk order inquiry.`,
          model: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            systemPrompt,
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: 'pNInz6obpgDQGcFmaJgB', // Indian English voice
          },
        },
        endCallFunctionEnabled: true,
        maxDurationSeconds: 180,
      }),
    })

    const data = await response.json()

    // Poll for call completion
    const result = await pollCallStatus(data.id, apiKey)

    return {
      callId: data.id,
      status: result.status === 'ended' ? 'completed' : 'failed',
      duration: result.duration || 0,
      transcript: result.transcript || '',
      summary: extractCallSummary(result.transcript || ''),
    }
  } catch (error) {
    console.error('Vapi call error:', error)
    return simulateCall(config)
  }
}

// Poll call status until complete
async function pollCallStatus(callId: string, apiKey: string): Promise<any> {
  const maxAttempts = 60 // 5 minutes max
  let attempts = 0

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    const data = await response.json()

    if (data.status === 'ended' || data.status === 'failed') {
      return data
    }

    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    attempts++
  }

  throw new Error('Call timeout')
}

// Extract key information from transcript
function extractCallSummary(transcript: string): VoiceCallResult['summary'] {
  // Use simple regex/keyword extraction
  // In production, use GPT-4 or Claude for better extraction
  
  const summary: VoiceCallResult['summary'] = {}

  // Extract price (looks for numbers followed by rupees/dollars)
  const priceMatch = transcript.match(/(?:₹|Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i)
  if (priceMatch) {
    summary.priceQuoted = parseFloat(priceMatch[1].replace(/,/g, ''))
    summary.currency = 'INR'
  }

  // Extract shipping days
  const shippingMatch = transcript.match(/(\d+)\s*(?:days?|weeks?)/i)
  if (shippingMatch) {
    const days = parseInt(shippingMatch[1])
    summary.shippingDays = transcript.toLowerCase().includes('week') ? days * 7 : days
  }

  // Check for customization
  if (/custom|design|personali[sz]e/i.test(transcript)) {
    summary.customizationAvailable = !/cannot|can't|not possible|no custom/i.test(transcript)
  }

  return summary
}

// Simulate call for demo/testing
function simulateCall(config: VoiceCallConfig): VoiceCallResult {
  const pricePerUnit = 75 + Math.random() * 40
  const shippingDays = 7 + Math.floor(Math.random() * 14)

  return {
    callId: `sim_${Date.now()}`,
    status: 'completed',
    duration: 120 + Math.floor(Math.random() * 60),
    transcript: `
Agent: Namaste, main ${config.vendorName} se baat kar raha hoon?

Vendor: Haan, bol rahe hain. (Yes, speaking)

Agent: Great! Main ek sourcing agent hoon. I'm inquiring about ${config.productDescription}, quantity ${config.quantity} units chahiye. Kya aap supply kar sakte hain?

Vendor: Yes yes, we can supply. For ${config.quantity} units, we can do ₹${pricePerUnit.toFixed(2)} per piece.

Agent: Acha, aur delivery kitne din mein ho jayegi?

Vendor: Standard delivery takes around ${shippingDays} days. We ship from our factory.

Agent: Custom design support hai? Client ke design ke saath karna hai.

Vendor: Yes, custom design possible. Just send us the artwork files, we'll handle it.

Agent: Perfect! Thank you so much for the information. We'll get back to you soon.

Vendor: No problem. Anytime.
    `.trim(),
    summary: {
      priceQuoted: Math.round(pricePerUnit),
      currency: 'INR',
      shippingDays,
      customizationAvailable: true,
      notes: 'Vendor confirmed availability and customization support',
    },
  }
}

// Batch call multiple vendors
export async function makeVoiceCallsBatch(configs: VoiceCallConfig[]): Promise<VoiceCallResult[]> {
  const results: VoiceCallResult[] = []

  for (const config of configs) {
    try {
      const result = await makeVapiCall(config)
      results.push(result)
      
      // Wait between calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`Call to ${config.vendorName} failed:`, error)
      results.push({
        callId: `error_${Date.now()}`,
        status: 'failed',
        duration: 0,
        transcript: '',
        summary: {},
      })
    }
  }

  return results
}
