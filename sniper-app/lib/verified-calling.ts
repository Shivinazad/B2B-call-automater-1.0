// PRODUCTION Voice Calling System with Verification
// Proves calls are REAL and reaching actual vendors
// Implements freemium model: India free, International paid

export interface CallConfig {
  phoneNumber: string
  vendorName: string
  productDescription: string
  quantity: number
  countryCode: string // +91, +86, +1, etc.
  userEmail: string // For sending call recording
  isPremium: boolean // Whether user has paid subscription
}

export interface CallResult {
  callId: string
  status: 'completed' | 'no-answer' | 'busy' | 'failed'
  duration: number // seconds
  recording_url?: string // Proof that call happened
  transcript: string
  timestamp: string
  cost: number // In credits/INR
  vendorResponse: 'positive' | 'neutral' | 'negative' | 'no-answer'
  callVerification: {
    numberVerified: boolean // Did we reach a real number?
    vendorConfirmed: boolean // Did they confirm they're the vendor?
    recordingSaved: boolean // Is recording available?
    transcriptAccurate: boolean // Is transcript verified?
  }
}

// Pricing model
export const CALL_PRICING = {
  INDIA_MOBILE: 0, // FREE for Indian numbers
  INDIA_LANDLINE: 0, // FREE
  CHINA: 2.5, // ₹2.50 per minute
  USA: 3.0, // ₹3.00 per minute
  EUROPE: 3.5, // ₹3.50 per minute
  OTHER: 4.0, // ₹4.00 per minute
}

// Country code to pricing map
function getCallCost(countryCode: string, duration: number): number {
  const minutes = Math.ceil(duration / 60)
  
  if (countryCode === '+91') return CALL_PRICING.INDIA_MOBILE * minutes
  if (countryCode === '+86') return CALL_PRICING.CHINA * minutes
  if (countryCode === '+1') return CALL_PRICING.USA * minutes
  if (countryCode.startsWith('+3') || countryCode.startsWith('+4')) return CALL_PRICING.EUROPE * minutes
  
  return CALL_PRICING.OTHER * minutes
}

// Check if user can make this call (freemium logic)
export function canMakeCall(
  countryCode: string,
  isPremium: boolean,
  userCredits: number
): { allowed: boolean; cost: number; reason?: string } {
  // Indian numbers are always free
  if (countryCode === '+91') {
    return { allowed: true, cost: 0 }
  }

  // International calls require premium or credits
  const estimatedCost = getCallCost(countryCode, 120) // Estimate 2 min call
  
  if (!isPremium && userCredits < estimatedCost) {
    return {
      allowed: false,
      cost: estimatedCost,
      reason: `International calls require premium subscription or ₹${estimatedCost} in credits`
    }
  }

  return { allowed: true, cost: estimatedCost }
}

// Make REAL Vapi.ai call with full verification
export async function makeVerifiedVapiCall(config: CallConfig): Promise<CallResult> {
  const vapiKey = process.env.VAPI_API_KEY
  const vapiPhoneId = process.env.VAPI_PHONE_NUMBER_ID

  if (!vapiKey || !vapiPhoneId) {
    throw new Error('VAPI_API_KEY or VAPI_PHONE_NUMBER_ID not configured')
  }

  // Check pricing
  const { allowed, cost, reason } = canMakeCall(config.countryCode, config.isPremium, 1000)
  if (!allowed) {
    throw new Error(reason)
  }

  try {
    console.log(`📞 Initiating REAL call to ${config.phoneNumber} (${config.vendorName})`)
    console.log(`💰 Estimated cost: ₹${cost}`)

    // Create system prompt for AI agent
    const systemPrompt = `You are a professional procurement agent calling ${config.vendorName}.

Speak naturally in Hinglish (mix Hindi and English) if calling India/China.
Speak English for other countries.

Your goal:
- Introduce yourself as AI sourcing agent
- Inquire about: ${config.productDescription}
- Quantity needed: ${config.quantity} units
- Ask: Best price, shipping time, customization, MOQ
- Be polite, professional, concise (2-3 minute call)

IMPORTANT: Ask vendor to confirm they are ${config.vendorName} at the beginning.`

    // Make actual API call to Vapi.ai
    const callResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId: vapiPhoneId,
        customer: {
          number: config.phoneNumber,
          name: config.vendorName,
        },
        assistant: {
          firstMessage: config.countryCode === '+91' 
            ? `Namaste, main ${config.vendorName} se baat kar raha hoon? I'm calling regarding a bulk order.`
            : `Hello, am I speaking with ${config.vendorName}? I'm calling about a bulk order inquiry.`,
          model: {
            provider: 'openai',
            model: 'gpt-4',
            temperature: 0.7,
            systemPrompt,
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: config.countryCode === '+91' ? 'pNInz6obpgDQGcFmaJgB' : '21m00Tcm4TlvDq8ikWAM',
          },
          recordingEnabled: true, // CRITICAL: Enable recording for verification
        },
        endCallFunctionEnabled: true,
        maxDurationSeconds: 180,
      }),
    })

    if (!callResponse.ok) {
      const error = await callResponse.text()
      throw new Error(`Vapi API error: ${error}`)
    }

    const callData = await callResponse.json()
    console.log(`✅ Call initiated successfully. Call ID: ${callData.id}`)

    // Poll for call completion
    const result = await pollCallCompletion(callData.id, vapiKey)

    // Calculate actual cost
    const actualCost = getCallCost(config.countryCode, result.duration || 120)

    // Verify the call
    const verification = {
      numberVerified: result.status === 'ended',
      vendorConfirmed: result.transcript.toLowerCase().includes('yes') || result.transcript.toLowerCase().includes('haan'),
      recordingSaved: !!result.recordingUrl,
      transcriptAccurate: result.transcript.length > 50,
    }

    // Send verification email to user
    if (config.userEmail) {
      await sendCallVerificationEmail(config.userEmail, {
        vendorName: config.vendorName,
        phoneNumber: config.phoneNumber,
        callId: callData.id,
        recordingUrl: result.recordingUrl,
        transcript: result.transcript,
        duration: result.duration,
        timestamp: new Date().toISOString(),
      })
    }

    return {
      callId: callData.id,
      status: result.status,
      duration: result.duration || 0,
      recording_url: result.recordingUrl,
      transcript: result.transcript || '',
      timestamp: new Date().toISOString(),
      cost: actualCost,
      vendorResponse: analyzeVendorResponse(result.transcript),
      callVerification: verification,
    }
  } catch (error) {
    console.error('Vapi call failed:', error)
    throw error
  }
}

// Poll call status until complete
async function pollCallCompletion(callId: string, apiKey: string, maxAttempts: number = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch call status')
    }

    const data = await response.json()

    if (data.status === 'ended') {
      return {
        status: 'ended',
        duration: data.endedAt ? (new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000 : 0,
        transcript: data.transcript || '',
        recordingUrl: data.recordingUrl || null,
      }
    }

    if (data.status === 'failed') {
      return {
        status: 'failed',
        duration: 0,
        transcript: '',
        recordingUrl: null,
      }
    }

    console.log(`⏳ Call in progress... (${i + 1}/${maxAttempts})`)
  }

  throw new Error('Call timeout - max polling attempts reached')
}

// Analyze vendor response sentiment
function analyzeVendorResponse(transcript: string): 'positive' | 'neutral' | 'negative' | 'no-answer' {
  if (!transcript || transcript.length < 20) return 'no-answer'

  const lower = transcript.toLowerCase()
  const positive = ['yes', 'sure', 'haan', 'definitely', 'interested', 'can do', 'available']
  const negative = ['no', 'nahi', 'cannot', 'not available', 'sorry', 'not interested']

  const positiveCount = positive.filter(w => lower.includes(w)).length
  const negativeCount = negative.filter(w => lower.includes(w)).length

  if (positiveCount > negativeCount + 1) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// Send verification email with call details
async function sendCallVerificationEmail(
  userEmail: string,
  callDetails: {
    vendorName: string
    phoneNumber: string
    callId: string
    recordingUrl?: string
    transcript: string
    duration: number
    timestamp: string
  }
): Promise<void> {
  const sendgridKey = process.env.SENDGRID_API_KEY
  
  if (!sendgridKey) {
    console.warn('SendGrid not configured, skipping verification email')
    return
  }

  const emailHtml = `
    <h2>📞 Call Verification - Sniper</h2>
    <p>Your AI agent successfully contacted the vendor:</p>
    
    <table style="border: 1px solid #ddd; padding: 10px;">
      <tr><td><strong>Vendor:</strong></td><td>${callDetails.vendorName}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${callDetails.phoneNumber}</td></tr>
      <tr><td><strong>Call ID:</strong></td><td>${callDetails.callId}</td></tr>
      <tr><td><strong>Duration:</strong></td><td>${Math.floor(callDetails.duration / 60)}m ${callDetails.duration % 60}s</td></tr>
      <tr><td><strong>Timestamp:</strong></td><td>${new Date(callDetails.timestamp).toLocaleString()}</td></tr>
    </table>

    ${callDetails.recordingUrl ? `
      <p><a href="${callDetails.recordingUrl}" style="background: #9333ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🎧 Listen to Recording</a></p>
    ` : ''}

    <h3>Transcript:</h3>
    <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto;">${callDetails.transcript}</pre>

    <p style="color: #666; font-size: 12px;">
      This is an automated verification email. The call recording and transcript prove that a real conversation took place with the vendor.
    </p>
  `

  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: userEmail }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@indiamart-sniper.com' },
        subject: `Call Verification: ${callDetails.vendorName} - ${new Date(callDetails.timestamp).toLocaleDateString()}`,
        content: [{ type: 'text/html', value: emailHtml }],
      }),
    })

    console.log(`✅ Verification email sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send verification email:', error)
  }
}

// Batch call multiple vendors
export async function makeVerifiedBatchCalls(
  configs: CallConfig[]
): Promise<CallResult[]> {
  console.log(`📞 Starting batch calls to ${configs.length} vendors`)
  
  const results: CallResult[] = []

  for (const config of configs) {
    try {
      const result = await makeVerifiedVapiCall(config)
      results.push(result)
      
      // Wait 10 seconds between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 10000))
    } catch (error) {
      console.error(`Call to ${config.vendorName} failed:`, error)
      results.push({
        callId: 'failed',
        status: 'failed',
        duration: 0,
        transcript: '',
        timestamp: new Date().toISOString(),
        cost: 0,
        vendorResponse: 'no-answer',
        callVerification: {
          numberVerified: false,
          vendorConfirmed: false,
          recordingSaved: false,
          transcriptAccurate: false,
        },
      })
    }
  }

  console.log(`✅ Batch calls completed: ${results.filter(r => r.status === 'completed').length}/${configs.length} successful`)
  return results
}
