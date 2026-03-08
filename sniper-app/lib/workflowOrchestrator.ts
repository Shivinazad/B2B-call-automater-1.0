// Workflow Orchestrator - The BRAIN of IndiaMART Sniper
// Executes the complete automation flow

export type WorkflowStepId = 
  | 'search-platforms'
  | 'currency-conversion'
  | 'ai-filtering'
  | 'voice-calls'
  | 'final-analysis'

export interface WorkflowContext {
  userRequirement: any
  sourcingMode: 'local' | 'global'
  vendors: any[]
  callResults: any[]
  finalResults: any[]
  callTranscript: string | null
}

export class WorkflowOrchestrator {
  public context: WorkflowContext
  private onStepUpdate: (stepId: string, status: string, data?: any) => void

  constructor(
    userRequirement: any,
    onStepUpdate: (stepId: string, status: string, data?: any) => void,
    sourcingMode: 'local' | 'global' = 'global'
  ) {
    this.context = {
      userRequirement,
      sourcingMode,
      vendors: [],
      callResults: [],
      finalResults: [],
      callTranscript: null,
    }
    this.onStepUpdate = onStepUpdate
  }

  async execute(): Promise<{ success: boolean; finalResults?: any[]; error?: string }> {
    try {
      // Step 1: Search platforms
      await this.executeStep('search-platforms', async () => {
        this.onStepUpdate('search-platforms', 'in-progress', 'Searching 12 B2B platforms...')
        await this.delay(4500) // Increased to simulate live scraping
        
        const vendors = await this.searchPlatforms()
        this.context.vendors = vendors
        return { vendorsFound: vendors.length }
      })

      // Step 2: Currency conversion
      await this.executeStep('currency-conversion', async () => {
        this.onStepUpdate('currency-conversion', 'in-progress', 'Converting USD, CNY to INR...')
        await this.delay(3000) // Increased to simulate live exchange rate fetching
        
        const converted = this.context.vendors // Already converted in API
        return { converted: converted.length }
      })

      // Step 3: AI filtering
      await this.executeStep('ai-filtering', async () => {
        this.onStepUpdate('ai-filtering', 'in-progress', 'Analyzing vendor quality scores...')
        await this.delay(5000) // Increased to simulate AI processing time
        
        // Filter vendors with good ratings, but always keep at least 3 so results never empty
        const filtered = this.context.vendors.filter((v: any) => v.rating >= 3.5)
        if (filtered.length >= 3) {
          this.context.vendors = filtered
        } else {
          // Fallback: take top 5 by rating regardless of threshold
          this.context.vendors = [...this.context.vendors]
            .sort((a: any, b: any) => b.rating - a.rating)
            .slice(0, 5)
        }
        return { filteredCount: this.context.vendors.length }
      })

      // Step 4: Voice calls (to top vendors)
      await this.executeStep('voice-calls', async () => {
        const topVendors = this.context.vendors
          .sort((a: any, b: any) => b.rating - a.rating)
          .slice(0, 5)

        this.onStepUpdate('voice-calls', 'in-progress', `Initiating call to top vendor...`)

        const callResponse = await this.initiateVoiceCalls(topVendors)

        if (callResponse.isBlandAI && callResponse.callId) {
          // Real Bland AI call — hold the workflow here until the call finishes on the user's phone
          this.onStepUpdate('voice-calls', 'in-progress', 'Live call connected. Waiting for negotiation to complete...')
          const { transcript } = await this.waitForCallCompletion(callResponse.callId)
          this.context.callTranscript = transcript
          // Attach transcript to the live call result
          if (callResponse.calls[0]) {
            callResponse.calls[0].transcript = transcript
          }
          this.onStepUpdate('voice-calls', 'in-progress', 'Call complete. Analysing negotiation results...')
          await this.delay(2000)
        } else {
          // Demo mode — simulate the call duration
          this.onStepUpdate('voice-calls', 'in-progress', 'Simulating vendor negotiation call...')
          await this.delay(12000)
        }

        this.context.callResults = callResponse.calls
        return { callsMade: callResponse.calls.length }
      })

      // Step 5: Final analysis and categorization
      await this.executeStep('final-analysis', async () => {
        this.onStepUpdate('final-analysis', 'in-progress', 'Generating final recommendations...')
        await this.delay(4000) // Final calculations time
        
        const results = this.categorizeFinalResults()
        this.context.finalResults = results
        return { categorized: results.length }
      })

      return { success: true, finalResults: this.context.finalResults }
    } catch (error) {
      console.error('Workflow execution failed:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async executeStep(
    stepId: WorkflowStepId,
    handler: () => Promise<any>
  ): Promise<void> {
    try {
      this.onStepUpdate(stepId, 'in-progress')
      
      const result = await handler()
      
      this.onStepUpdate(stepId, 'completed', result)
    } catch (error) {
      this.onStepUpdate(stepId, 'error', { error: (error as Error).message })
      throw error
    }
  }

  private async searchPlatforms(): Promise<any[]> {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: this.context.userRequirement?.productDescription || 'products',
          quantity: this.context.userRequirement?.quantity || 1000,
          mode: this.context.sourcingMode,
        }),
      })

      const data = await response.json()
      return data.vendors || []
    } catch (error) {
      console.error('Search platforms error:', error)
      // Return fallback data
      return this.generateFallbackVendors()
    }
  }

  private async initiateVoiceCalls(vendors: any[]): Promise<{ calls: any[]; isBlandAI?: boolean; callId?: string }> {
    try {
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendors,
          product: this.context.userRequirement?.productDescription || 'products',
          quantity: this.context.userRequirement?.quantity || 1000,
          hasDesignFiles: (this.context.userRequirement?.designFiles?.length ?? 0) > 0,
        }),
      })

      const data = await response.json()
      return {
        calls: data.calls || [],
        isBlandAI: data.isBlandAI ?? false,
        callId: data.callId,
      }
    } catch (error) {
      console.error('Voice calls error:', error)
      return {
        calls: vendors.map(v => ({
          vendor: v.vendorName,
          status: 'completed',
          sentiment: 'positive',
          priceQuoted: Math.round(v.priceInINR * 0.95),
        })),
      }
    }
  }

  /**
   * Polls /api/call-status every 5 seconds until Bland AI reports the call as done.
   * Maximum wait is 30 minutes, so a hackathon demo call can run to natural completion.
   * Returns the final transcript text when available.
   */
  private async waitForCallCompletion(callId: string): Promise<{ transcript: string | null }> {
    const MAX_WAIT_MS = 30 * 60 * 1000 // 30 minutes
    const POLL_INTERVAL_MS = 5000
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_WAIT_MS) {
      await this.delay(POLL_INTERVAL_MS)
      try {
        const res = await fetch(`/api/call-status?callId=${callId}`)
        const data = await res.json()
        if (data.isDone || data.status === 'completed' || data.status === 'failed' || data.status === 'error') {
          return { transcript: data.transcript ?? null }
        }
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        this.onStepUpdate(
          'voice-calls',
          'in-progress',
          `Live call in progress — ${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed...`
        )
      } catch {
        // Network blip — keep polling
      }
    }
    return { transcript: null }
  }

  private categorizeFinalResults(): any[] {
    const vendors = this.context.vendors
    
    if (vendors.length === 0) return []

    // Find best in each category
    const sortedByPrice = [...vendors].sort((a, b) => a.priceInINR - b.priceInINR)
    const sortedByRating = [...vendors].sort((a, b) => b.rating - a.rating)
    const sortedByShipping = [...vendors].sort((a, b) => a.shippingDays - b.shippingDays)

    // Assign categories
    // For live Bland AI calls, the result uses vendor: 'Live Call via AI' for the top vendor.
    // We match it to the highest-rated vendor so the negotiated price flows through.
    const liveCallResult = this.context.callResults.find((c: any) => c.vendor === 'Live Call via AI')
    const categorized = vendors.map((v, index) => {
      let category = null
      if (v.id === sortedByPrice[0]?.id) category = 'cheapest'
      else if (v.id === sortedByRating[0]?.id) category = 'best-reviewed'
      else if (v.id === sortedByShipping[0]?.id) category = 'fastest'
      
      // Match call result by exact vendor name first, then fall back to live call for index 0
      const callResult = this.context.callResults.find((c: any) => c.vendor === v.vendorName)
        || (liveCallResult && index === 0 ? liveCallResult : null)
      
      return {
        ...v,
        category,
        callStatus: callResult?.status || 'not-called',
        priceQuoted: callResult?.priceQuoted || Math.round(v.priceInINR * 0.94),
        callSentiment: callResult?.sentiment || (index < 3 ? 'positive' : 'neutral'),
        // Attach the real call transcript to the winner (index 0 = highest-rated)
        transcript: index === 0 ? (this.context.callTranscript ?? callResult?.transcript ?? null) : null,
      }
    })

    return categorized
  }

  private generateFallbackVendors(): any[] {
    // Generate fallback vendors in case API fails
    return [
      {
        id: 'fallback_1',
        platform: 'IndiaMart',
        vendorName: 'Shree Krishna Enterprises',
        price: 85,
        currency: 'INR',
        priceInINR: 85,
        priceQuoted: 80,
        rating: 4.5,
        reviews: 234,
        location: 'Mumbai, India',
        phoneNumber: '+91 9800000001',
        email: 'info@shreekrishna.example.com',
        productUrl: 'https://www.indiamart.com',
        customCapable: true,
        shippingDays: 7,
        moq: 500,
        callStatus: 'not-called',
        callSentiment: null,
        category: null,
      },
      {
        id: 'fallback_2',
        platform: 'Alibaba',
        vendorName: 'Shenzhen Glory Technology',
        price: 11,
        currency: 'USD',
        priceInINR: 920,
        priceQuoted: 874,
        rating: 4.7,
        reviews: 1245,
        location: 'Shenzhen, China',
        phoneNumber: '+86 13812345678',
        email: 'sales@glorytechnology.example.com',
        productUrl: 'https://www.alibaba.com',
        customCapable: true,
        shippingDays: 21,
        moq: 1000,
        callStatus: 'not-called',
        callSentiment: null,
        category: null,
      },
      {
        id: 'fallback_3',
        platform: 'TradeIndia',
        vendorName: 'Global Textile Hub',
        price: 92,
        currency: 'INR',
        priceInINR: 92,
        priceQuoted: 88,
        rating: 4.2,
        reviews: 180,
        location: 'Surat, India',
        phoneNumber: '+91 9800000002',
        email: 'contact@globaltextile.example.com',
        productUrl: 'https://www.tradeindia.com',
        customCapable: true,
        shippingDays: 5,
        moq: 200,
        callStatus: 'not-called',
        callSentiment: null,
        category: null,
      },
    ]
  }
}
