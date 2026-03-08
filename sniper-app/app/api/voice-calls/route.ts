import { NextRequest, NextResponse } from 'next/server'
import { makeVoiceCallsBatch } from '@/lib/voiceAgent'

export async function POST(request: NextRequest) {
  try {
    const { vendors, userRequirement } = await request.json()

    // Select top vendors for calling
    const topVendors = vendors
      .sort((a: any, b: any) => a.priceInINR - b.priceInINR)
      .slice(0, 5)

    const callConfigs = topVendors.map((vendor: any) => ({
      phoneNumber: vendor.phoneNumber,
      vendorName: vendor.vendorName,
      productDescription: userRequirement.productDescription,
      quantity: userRequirement.quantity,
    }))

    const callResults = await makeVoiceCallsBatch(callConfigs)

    // Update vendor data with call results
    const updatedVendors = topVendors.map((vendor: any, index: number) => {
      const callResult = callResults[index]
      
      if (callResult && callResult.summary.priceQuoted) {
        return {
          ...vendor,
          priceAfterCall: callResult.summary.priceQuoted,
          callTranscript: callResult.transcript,
          callStatus: callResult.status,
        }
      }
      
      return vendor
    })

    return NextResponse.json({
      success: true,
      calls: callResults,
      updatedVendors,
    })
  } catch (error) {
    console.error('Voice calls error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to make voice calls' },
      { status: 500 }
    )
  }
}
