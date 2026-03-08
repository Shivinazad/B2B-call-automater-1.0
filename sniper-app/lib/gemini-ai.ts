// GOOGLE GEMINI AI Integration - Replacing OpenAI GPT-4
// Free tier: 60 requests/minute, much more generous than OpenAI
// API: https://ai.google.dev/

export interface VendorAnalysis {
  qualityScore: number // 0-100
  reliabilityScore: number // 0-100
  priceCompetitiveness: number // 0-100
  recommendationLevel: 'highly-recommended' | 'recommended' | 'neutral' | 'not-recommended'
  insights: string[]
  risks: string[]
  strengths: string[]
}

export interface CallTranscriptAnalysis {
  priceQuoted?: number
  currency?: string
  shippingDays?: number
  customizationAvailable: boolean
  moq?: number
  paymentTerms?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyPoints: string[]
}

// Initialize Gemini API
function getGeminiAPIKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY
  if (!key) {
    throw new Error('GOOGLE_GEMINI_API_KEY not set in environment')
  }
  return key
}

// Analyze vendor using Gemini Pro
export async function analyzeVendorWithGemini(vendor: {
  vendorName: string
  rating: number
  reviews: number
  price: number
  currency: string
  location: string
  moq: number
  platform: string
  responseRate?: number
  verified?: boolean
}): Promise<VendorAnalysis> {
  const apiKey = getGeminiAPIKey()
  
  try {
    const prompt = `Analyze this B2B vendor for a bulk order:

Vendor: ${vendor.vendorName}
Platform: ${vendor.platform}
Rating: ${vendor.rating}/5.0 (${vendor.reviews} reviews)
Price: ${vendor.currency} ${vendor.price} per unit
Location: ${vendor.location}
MOQ: ${vendor.moq} units
Response Rate: ${vendor.responseRate || 'Unknown'}%
Verified: ${vendor.verified ? 'Yes' : 'No'}

Provide a detailed analysis including:
1. Quality score (0-100)
2. Reliability score (0-100)
3. Price competitiveness (0-100, where 100 is best value)
4. Recommendation level
5. Key insights
6. Potential risks
7. Vendor strengths

Format as JSON.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''
    
    // Parse Gemini response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          qualityScore: parsed.qualityScore || 75,
          reliabilityScore: parsed.reliabilityScore || 70,
          priceCompetitiveness: parsed.priceCompetitiveness || 80,
          recommendationLevel: parsed.recommendationLevel || 'recommended',
          insights: parsed.insights || [],
          risks: parsed.risks || [],
          strengths: parsed.strengths || []
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini JSON response, using rule-based fallback')
    }

    // Fallback to rule-based scoring
    return generateRuleBasedAnalysis(vendor)
  } catch (error) {
    console.error('Gemini API error:', error)
    return generateRuleBasedAnalysis(vendor)
  }
}

// Analyze voice call transcript using Gemini
export async function analyzeCallTranscriptWithGemini(
  transcript: string,
  vendorName: string
): Promise<CallTranscriptAnalysis> {
  const apiKey = getGeminiAPIKey()

  try {
    const prompt = `Analyze this voice call transcript between an AI sourcing agent and a vendor:

Vendor: ${vendorName}
Transcript:
${transcript}

Extract:
1. Price quoted (if mentioned)
2. Currency
3. Shipping/delivery days
4. Can they do customization?
5. Minimum order quantity (MOQ)
6. Payment terms
7. Overall sentiment (positive/neutral/negative)
8. Key discussion points

Format as JSON with these exact keys: priceQuoted, currency, shippingDays, customizationAvailable, moq, paymentTerms, sentiment, keyPoints`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''
    
    // Parse response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          priceQuoted: parsed.priceQuoted,
          currency: parsed.currency,
          shippingDays: parsed.shippingDays,
          customizationAvailable: parsed.customizationAvailable || false,
          moq: parsed.moq,
          paymentTerms: parsed.paymentTerms,
          sentiment: parsed.sentiment || 'neutral',
          keyPoints: parsed.keyPoints || []
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini transcript analysis')
    }

    // Fallback: regex extraction
    return extractCallInfoWithRegex(transcript)
  } catch (error) {
    console.error('Gemini transcript analysis error:', error)
    return extractCallInfoWithRegex(transcript)
  }
}

// Rule-based vendor analysis (fallback)
function generateRuleBasedAnalysis(vendor: any): VendorAnalysis {
  const qualityScore = Math.min(100, vendor.rating * 20 + (vendor.verified ? 10 : 0))
  const reliabilityScore = Math.min(100, 
    (vendor.reviews > 100 ? 80 : 60) + 
    (vendor.responseRate || 70) * 0.2 +
    (vendor.verified ? 10 : 0)
  )
  
  // Price competitiveness (inverse - lower is better)
  const avgPrice = vendor.currency === 'INR' ? 110 : 13
  const priceCompetitiveness = Math.max(0, Math.min(100, 
    100 - ((vendor.price - avgPrice) / avgPrice) * 100
  ))

  const insights = [
    `${vendor.reviews} customer reviews indicate ${vendor.reviews > 200 ? 'established' : 'growing'} business`,
    `Located in ${vendor.location} with ${vendor.currency} pricing`,
    `Minimum order: ${vendor.moq} units`,
  ]

  const risks = []
  if (vendor.reviews < 50) risks.push('Low review count - new or less active seller')
  if (!vendor.verified) risks.push('Not verified on platform')
  if (vendor.rating < 4.0) risks.push('Below-average rating')

  const strengths = []
  if (vendor.verified) strengths.push('Verified vendor status')
  if (vendor.responseRate && vendor.responseRate > 80) strengths.push('High response rate')
  if (vendor.rating >= 4.5) strengths.push('Excellent customer ratings')

  const avgScore = (qualityScore + reliabilityScore + priceCompetitiveness) / 3
  const recommendationLevel = 
    avgScore >= 80 ? 'highly-recommended' :
    avgScore >= 65 ? 'recommended' :
    avgScore >= 50 ? 'neutral' : 'not-recommended'

  return {
    qualityScore: Math.round(qualityScore),
    reliabilityScore: Math.round(reliabilityScore),
    priceCompetitiveness: Math.round(priceCompetitiveness),
    recommendationLevel,
    insights,
    risks,
    strengths
  }
}

// Regex-based call transcript extraction (fallback)
function extractCallInfoWithRegex(transcript: string): CallTranscriptAnalysis {
  const priceMatch = transcript.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)|(?:\$|USD)\s*([0-9,]+(?:\.[0-9]{1,2})?)/)
  const priceQuoted = priceMatch ? parseFloat((priceMatch[1] || priceMatch[2]).replace(/,/g, '')) : undefined
  
  const currencyMatch = transcript.match(/\b(INR|USD|EUR|CNY|GBP)\b/i)
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : undefined

  const daysMatch = transcript.match(/([0-9]+)\s*days?/i)
  const shippingDays = daysMatch ? parseInt(daysMatch[1]) : undefined

  const customMatch = transcript.match(/\b(custom|customization|personalize|customize)\b/i)
  const customizationAvailable = !!customMatch

  const moqMatch = transcript.match(/(?:MOQ|minimum order|minimum quantity)[\s:]*([0-9,]+)/i)
  const moq = moqMatch ? parseInt(moqMatch[1].replace(/,/g, '')) : undefined

  const paymentMatch = transcript.match(/(?:payment|pay)[\s:]*([a-z0-9\s,]+)/i)
  const paymentTerms = paymentMatch ? paymentMatch[1].trim() : undefined

  // Sentiment analysis (simple keyword-based)
  const positiveWords = ['yes', 'sure', 'definitely', 'great', 'excellent', 'happy', 'agree']
  const negativeWords = ['no', 'cannot', 'unable', 'sorry', 'difficult', 'problem']
  
  const lowerTranscript = transcript.toLowerCase()
  const positiveCount = positiveWords.filter(w => lowerTranscript.includes(w)).length
  const negativeCount = negativeWords.filter(w => lowerTranscript.includes(w)).length
  
  const sentiment: 'positive' | 'neutral' | 'negative' = 
    positiveCount > negativeCount + 1 ? 'positive' :
    negativeCount > positiveCount + 1 ? 'negative' : 'neutral'

  return {
    priceQuoted,
    currency,
    shippingDays,
    customizationAvailable,
    moq,
    paymentTerms,
    sentiment,
    keyPoints: transcript.split('\n').filter(line => line.trim().length > 10).slice(0, 5)
  }
}

// Batch analyze multiple vendors
export async function batchAnalyzeVendors(vendors: any[]): Promise<VendorAnalysis[]> {
  const analyses = await Promise.all(
    vendors.map(vendor => analyzeVendorWithGemini(vendor))
  )
  return analyses
}

// Compare multiple vendors and rank them
export async function compareVendorsWithGemini(vendors: any[]): Promise<{
  rankings: Array<{ vendorName: string; score: number; reason: string }>
  bestOverall: string
  bestValue: string
  bestQuality: string
}> {
  const apiKey = getGeminiAPIKey()

  try {
    const vendorList = vendors.map((v, i) => 
      `${i + 1}. ${v.vendorName} - ${v.currency} ${v.price}, ${v.rating}★ (${v.reviews} reviews), ${v.location}`
    ).join('\n')

    const prompt = `Compare these B2B vendors and rank them:

${vendorList}

Provide:
1. Overall ranking with scores (0-100)
2. Best overall vendor
3. Best value for money
4. Best quality vendor

Format as JSON with keys: rankings (array), bestOverall, bestValue, bestQuality`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
        })
      }
    )

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Gemini comparison error:', error)
  }

  // Fallback ranking
  const ranked = vendors.map(v => ({
    vendorName: v.vendorName,
    score: v.rating * 15 + (v.reviews > 100 ? 20 : 10) + (v.verified ? 10 : 0),
    reason: `Rating: ${v.rating}, Reviews: ${v.reviews}`
  })).sort((a, b) => b.score - a.score)

  return {
    rankings: ranked,
    bestOverall: ranked[0].vendorName,
    bestValue: vendors.reduce((best, v) => v.price < best.price ? v : best).vendorName,
    bestQuality: vendors.reduce((best, v) => v.rating > best.rating ? v : best).vendorName
  }
}
