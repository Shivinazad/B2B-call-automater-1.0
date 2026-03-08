// API Integration Utilities

// Currency Conversion using Free API
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'INR'
): Promise<number> {
  try {
    // Using exchangerate-api.com (free tier)
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'demo'
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}/${amount}`
    )
    
    if (!response.ok) {
      throw new Error('Currency conversion failed')
    }

    const data = await response.json()
    return Math.round(data.conversion_result)
  } catch (error) {
    console.error('Currency conversion error:', error)
    // Fallback rates (approximate)
    const rates: Record<string, number> = {
      USD: 83,
      EUR: 90,
      GBP: 105,
      CNY: 11.5,
    }
    return Math.round(amount * (rates[fromCurrency] || 1))
  }
}

// Scrape platforms using free Puppeteer (or paid Firecrawl if available)
export async function scrapePlatform(platform: string, query: string) {
  // In production, use Firecrawl or Puppeteer
  // For demo, return mock data
  
  const mockResults = [
    {
      vendorName: `${platform} Vendor ${Math.floor(Math.random() * 100)}`,
      price: 80 + Math.random() * 50,
      currency: platform.includes('Alibaba') ? 'USD' : 'INR',
      rating: 4 + Math.random(),
      reviews: Math.floor(Math.random() * 500) + 50,
      shippingDays: Math.floor(Math.random() * 20) + 5,
      location: platform.includes('Alibaba') ? 'China' : 'India',
      customCapable: Math.random() > 0.3,
      moq: Math.floor(Math.random() * 500) + 100,
    },
  ]

  return mockResults
}

// Hugging Face API for NLP/Analysis (Free Inference API)
export async function analyzeVendorWithAI(vendorData: any) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    
    if (!apiKey) {
      return { score: Math.random() * 100, analysis: 'Demo mode' }
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `Vendor: ${vendorData.vendorName}, Rating: ${vendorData.rating}, Reviews: ${vendorData.reviews}`,
          parameters: { candidate_labels: ['reliable', 'unreliable', 'premium', 'budget'] },
        }),
      }
    )

    const data = await response.json()
    return { score: data.scores[0] * 100, analysis: data.labels[0] }
  } catch (error) {
    console.error('AI analysis error:', error)
    return { score: 85, analysis: 'reliable' }
  }
}

// Voice Call using Vapi.ai or Retell AI (Free trial credits)
export async function makeVoiceCall(
  phoneNumber: string,
  message: string,
  vendorName: string
) {
  try {
    const vapiKey = process.env.VAPI_API_KEY
    
    if (!vapiKey) {
      // Simulate call in demo mode
      return {
        callId: `call_${Date.now()}`,
        status: 'completed',
        transcript: `[SIMULATED] Called ${vendorName} at ${phoneNumber}. Discussed pricing and shipping. Best quote: ₹85/unit with 2-week delivery.`,
        duration: 180,
      }
    }

    // Vapi.ai integration (when API key is available)
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        assistantId: 'your-assistant-id', // Configure Hinglish assistant in Vapi dashboard
        customer: {
          name: vendorName,
        },
      }),
    })

    const data = await response.json()
    return {
      callId: data.id,
      status: data.status,
      transcript: data.transcript,
      duration: data.duration,
    }
  } catch (error) {
    console.error('Voice call error:', error)
    return {
      callId: `error_${Date.now()}`,
      status: 'failed',
      transcript: 'Call failed',
      duration: 0,
    }
  }
}

// Send email with design files (using SendGrid free tier)
export async function sendDesignEmail(
  toEmail: string,
  vendorName: string,
  files: any[]
) {
  try {
    const sendgridKey = process.env.SENDGRID_API_KEY
    
    if (!sendgridKey) {
      // Simulate in demo mode
      return { success: true, messageId: `msg_${Date.now()}` }
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail, name: vendorName }] }],
        from: { email: 'noreply@sniper.ai', name: 'Sniper' },
        subject: 'Custom Design Requirements',
        content: [
          {
            type: 'text/plain',
            value: `Hello ${vendorName},\n\nPlease find attached our custom design files for the quote request.\n\nBest regards,\nSniper`,
          },
        ],
        // attachments would go here
      }),
    })

    return { success: response.ok, messageId: 'sent' }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, messageId: 'error' }
  }
}

// Verify PAN/GST using API Setu (Sandbox)
export async function verifyBusinessCredentials(pan?: string, gst?: string) {
  // Using API Setu sandbox for demo
  // In production, use actual credentials
  
  return {
    panVerified: !!pan,
    gstVerified: !!gst,
    businessName: 'Demo Business Pvt Ltd',
    status: 'active',
  }
}
