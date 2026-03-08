import { NextRequest, NextResponse } from 'next/server'
import { scrapeVendors, getVendorBreakdown, analyzeBestVendors } from '@/lib/vendor-scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productDescription, quantity = 1000, mode = 'global' } = body

    if (!productDescription) {
      return NextResponse.json(
        { success: false, error: 'Product description is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Searching for: ${productDescription}, Qty: ${quantity}, Mode: ${mode}`)

    // Scrape all platforms
    const vendors = await scrapeVendors(productDescription, quantity, mode)
    
    console.log(`✅ Found ${vendors.length} vendors from ${Object.keys(getVendorBreakdown(vendors)).length} platforms`)

    // Analyze results
    const breakdown = getVendorBreakdown(vendors)
    const analysis = analyzeBestVendors(vendors)

    return NextResponse.json({
      success: true,
      query: productDescription,
      quantity,
      totalVendors: vendors.length,
      platforms: Object.keys(breakdown).length,
      breakdown,
      vendors,
      analysis: {
        bestPrice: analysis.bestPrice ? {
          name: analysis.bestPrice.vendorName,
          price: analysis.bestPrice.priceInINR,
          platform: analysis.bestPrice.platform,
        } : null,
        bestRated: analysis.bestRated ? {
          name: analysis.bestRated.vendorName,
          rating: analysis.bestRated.rating,
          platform: analysis.bestRated.platform,
        } : null,
        bestValue: analysis.bestValue ? {
          name: analysis.bestValue.vendorName,
          platform: analysis.bestValue.platform,
        } : null,
        fastestShipping: analysis.fastestShipping ? {
          name: analysis.fastestShipping.vendorName,
          days: analysis.fastestShipping.shippingDays,
          platform: analysis.fastestShipping.platform,
        } : null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Search vendors error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search vendors' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Sniper API - Use POST to search vendors',
    platforms: [
      'IndiaMart', 'Alibaba', 'TradeIndia', 'Made-in-China',
      'GlobalSources', 'ExportersIndia', 'DHgate', 'Udaan',
      'TradeKey', 'JustDial B2B', 'Meesho B2B', 'SEA Sourcing',
    ],
    totalPlatforms: 12,
  })
}
