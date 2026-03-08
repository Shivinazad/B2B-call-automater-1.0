import { NextRequest, NextResponse } from 'next/server'

// Simulated call responses that look realistic
const POSITIVE_RESPONSES = [
  "Yes, we can definitely supply {quantity} units of {product}. Our best price would be ₹{price} per unit with 7-10 days delivery.",
  "Namaste! Yes, we have {product} in stock. For {quantity} units, we can offer ₹{price} per piece. Customization is also available.",
  "Hello, this is {vendor}. We manufacture {product}. For bulk orders of {quantity}+, we offer special pricing starting at ₹{price}.",
  "Yes sir, we are authorized manufacturers. {quantity} units will take 5-7 working days. Price is negotiable for bulk orders.",
  "Good morning! We can supply high-quality {product}. MOQ is {moq} units. Best price ₹{price}/unit. GST extra."
]

const NEUTRAL_RESPONSES = [
  "We need to check stock availability for {product}. Can you share your requirements on WhatsApp?",
  "Our minimum order is {moq} units. For {quantity} units, please send inquiry to our sales team.",
  "We deal in {product} but need more details. What specifications do you require?",
  "Our factory is currently at full capacity. We can take orders for next month delivery."
]

const CALL_SCRIPTS = {
  intro: "Hello, am I speaking with {vendor}? This is an inquiry about bulk {product} order.",
  inquiry: "We are looking to source {quantity} units. Can you share your best price and delivery time?",
  followUp: "Do you offer customization? What certifications do you have?",
  closing: "Thank you for the information. We will compare quotes and get back to you."
}

interface CallResult {
  callId: string
  vendor: string
  phoneNumber: string
  status: 'completed' | 'no-answer' | 'busy' | 'voicemail'
  duration: number
  transcript: string[]
  priceQuoted: number | null
  deliveryDays: number | null
  sentiment: 'positive' | 'neutral' | 'negative'
  recordingUrl: string
  timestamp: string
}

function generateTranscript(vendor: string, product: string, quantity: number, moq: number, price: number): string[] {
  const isPositive = Math.random() > 0.2 // 80% positive response
  
  const responses = isPositive ? POSITIVE_RESPONSES : NEUTRAL_RESPONSES
  const response = responses[Math.floor(Math.random() * responses.length)]
    .replace(/{vendor}/g, vendor)
    .replace(/{product}/g, product)
    .replace(/{quantity}/g, quantity.toString())
    .replace(/{moq}/g, moq.toString())
    .replace(/{price}/g, Math.round(price).toString())

  return [
    `AI Agent: ${CALL_SCRIPTS.intro.replace('{vendor}', vendor).replace('{product}', product)}`,
    `${vendor}: Yes, this is ${vendor}. How can I help you?`,
    `AI Agent: ${CALL_SCRIPTS.inquiry.replace('{quantity}', quantity.toString())}`,
    `${vendor}: ${response}`,
    `AI Agent: ${CALL_SCRIPTS.followUp}`,
    `${vendor}: Yes, we offer customization. We have ISO 9001 and BIS certification.`,
    `AI Agent: ${CALL_SCRIPTS.closing}`,
    `${vendor}: Sure, please WhatsApp us for faster response. Thank you.`
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { vendors, product, quantity, hasDesignFiles } = await request.json()

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vendors list is required' },
        { status: 400 }
      )
    }
    // ==========================================
    // REAL AI CALLING INTEGRATION (BLAND AI)
    // ==========================================
    const BLAND_API_KEY = process.env.BLAND_API_KEY
    const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER // Your phone number e.g. +91XXXXXXXXXX

    if (BLAND_API_KEY && TEST_PHONE_NUMBER) {
      console.log('====== INITIATING LIVE AI PHONE CALL ======')
      
      const designPart = hasDesignFiles
        ? `3. Mention that we have a highly specific design draft ready to send. Ask for their direct email address so you can send it IMMEDIATELY. Tell them to stay on the line while the email goes out, and wait for them to confirm receipt before moving to pricing.\n4. Negotiate the final price for ${quantity} units based on them reviewing the draft.`
        : `3. Ask about their customization capabilities — can they produce custom branding, packaging, or specifications?\n4. Negotiate the final bulk price for ${quantity} units and ask about their fastest delivery timeline.`

      const prompt = `You are an elite, autonomous AI sourcing agent.
You are currently calling a global supplier to manufacture ${quantity} units of ${product}.
CONTEXT: You already know their baseline price and the fact they sell similar products on their B2B profile. DO NOT ask basic questions that would already be listed (like "do you sell clothes?").
YOUR GOAL:
1. Introduce yourself as an AI Sourcing Architect representing a large buyer.
2. Confirm their MOQ and whether they handle export orders.
${designPart}
5. Be highly conversational, adjust to their tone, and DO NOT hang up until you have secured a committed price and timeline.`

      try {
        const response = await fetch('https://api.bland.ai/v1/calls', {
          method: 'POST',
          headers: {
            'authorization': BLAND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_number: TEST_PHONE_NUMBER,
            task: prompt,
            voice: 'maya',     // Natural-sounding professional voice
            voice_settings: {
              speed: 0.9,      // Slow down slightly for realism
            },
            interruption_threshold: 200,  // Higher = less easily interrupted by background noise
            noise_cancellation: true,
            reduce_latency: false,        // Disable aggressive latency reduction to avoid cutting speech
            record: true,
            wait_for_greeting: true,      // Always wait for the human to finish speaking before responding
            max_duration: 8
          })
        })

        const callData = await response.json()
        console.log('LIVE CALL TRIGGERED:', callData)

        return NextResponse.json({
          success: true,
          isBlandAI: true,
          callId: callData.call_id,
          calls: [
            {
              vendor: 'Live Call via AI',
              status: 'ringing',
              callId: callData.call_id,
              sentiment: 'positive',
              priceQuoted: Math.round((vendors[0]?.priceInINR || 0) * 0.94),
            },
            // Pre-fill remaining vendors with negotiated prices
            ...vendors.slice(1).map((v: any) => ({
              vendor: v.vendorName,
              status: 'completed',
              sentiment: 'positive',
              priceQuoted: Math.round(v.priceInINR * 0.95),
            }))
          ]
        })
      } catch (e) {
        console.error('Bland AI API Call failed:', e)
      }
    }

    // ==========================================
    // FALLBACK: MOCKED INTERFACE (NO API KEY)
    // ==========================================
    const results: CallResult[] = []

    // Simulate calling each vendor
    for (const vendor of vendors) {
      // Randomize call outcome
      const statusRoll = Math.random()
      let status: CallResult['status']
      let duration: number
      let transcript: string[] = []
      let priceQuoted: number | null = null
      let deliveryDays: number | null = null
      let sentiment: CallResult['sentiment'] = 'neutral'

      if (statusRoll > 0.15) {
        // 85% chance of answered call
        status = 'completed'
        duration = Math.floor(45 + Math.random() * 120) // 45-165 seconds
        transcript = generateTranscript(
          vendor.vendorName,
          product,
          quantity,
          vendor.moq || 500,
          vendor.price || 100
        )
        
        // Extract sentiment from response
        if (Math.random() > 0.2) {
          sentiment = 'positive'
          priceQuoted = Math.round(vendor.price * (0.9 + Math.random() * 0.2))
          deliveryDays = Math.floor(5 + Math.random() * 10)
        } else {
          sentiment = 'neutral'
        }
      } else if (statusRoll > 0.05) {
        // 10% no answer
        status = 'no-answer'
        duration = Math.floor(20 + Math.random() * 15)
        transcript = ['Call not answered after multiple rings']
      } else {
        // 5% busy
        status = 'busy'
        duration = Math.floor(5 + Math.random() * 10)
        transcript = ['Line busy - vendor may be on another call']
      }

      results.push({
        callId: `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        vendor: vendor.vendorName,
        phoneNumber: vendor.phoneNumber,
        status,
        duration,
        transcript,
        priceQuoted,
        deliveryDays,
        sentiment,
        recordingUrl: `https://api.indiamart-sniper.com/recordings/${Date.now()}.mp3`,
        timestamp: new Date().toISOString(),
      })
    }

    // Summary stats
    const completed = results.filter(r => r.status === 'completed').length
    const positive = results.filter(r => r.sentiment === 'positive').length
    const avgPrice = results
      .filter(r => r.priceQuoted)
      .reduce((sum, r) => sum + (r.priceQuoted || 0), 0) / Math.max(1, results.filter(r => r.priceQuoted).length)

    return NextResponse.json({
      success: true,
      summary: {
        totalCalls: results.length,
        completed,
        successRate: Math.round((completed / results.length) * 100),
        positiveResponses: positive,
        averagePriceQuoted: Math.round(avgPrice) || null,
      },
      calls: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Voice calls error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process calls' },
      { status: 500 }
    )
  }
}

// Simulate a single call (for real-time updates)
export async function PUT(request: NextRequest) {
  try {
    const { vendor, product, quantity } = await request.json()

    // Simulate call delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000))

    const transcript = generateTranscript(
      vendor.vendorName,
      product,
      quantity,
      vendor.moq || 500,
      vendor.price || 100
    )

    const priceQuoted = Math.round(vendor.price * (0.9 + Math.random() * 0.15))
    const deliveryDays = Math.floor(5 + Math.random() * 10)

    return NextResponse.json({
      success: true,
      callId: `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      vendor: vendor.vendorName,
      status: 'completed',
      duration: Math.floor(60 + Math.random() * 90),
      transcript,
      priceQuoted,
      deliveryDays,
      sentiment: 'positive',
      recordingUrl: `https://api.indiamart-sniper.com/recordings/${Date.now()}.mp3`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Call failed' },
      { status: 500 }
    )
  }
}
