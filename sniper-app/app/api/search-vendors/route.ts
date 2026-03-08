import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllPlatforms } from '@/lib/scrapers'
import { convertCurrency } from '@/lib/apiIntegrations'

export async function POST(request: NextRequest) {
  try {
    const { productDescription, quantity, platforms } = await request.json()

    // Scrape all platforms
    const scrapedVendors = await scrapeAllPlatforms(productDescription)
    
    const results = []

    for (const vendor of scrapedVendors) {
      // Convert to INR if needed
      let priceInINR = vendor.price
      if (vendor.currency !== 'INR') {
        priceInINR = await convertCurrency(vendor.price, vendor.currency, 'INR')
      }

      results.push({
        id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: getPlatformFromEmail(vendor.email),
        vendorName: vendor.vendorName,
        price: vendor.price,
        currency: vendor.currency,
        priceInINR,
        rating: vendor.rating,
        reviews: vendor.reviews,
        shippingDays: vendor.shippingDays,
        location: vendor.location,
        phoneNumber: vendor.phoneNumber,
        email: vendor.email,
        productUrl: vendor.productUrl,
        customCapable: vendor.customCapable,
        moq: vendor.moq,
        category: null,
      })
    }

    // Sort by price
    results.sort((a, b) => a.priceInINR - b.priceInINR)

    return NextResponse.json({ success: true, vendors: results })
  } catch (error) {
    console.error('Search vendors error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search vendors' },
      { status: 500 }
    )
  }
}

function getPlatformFromEmail(email: string): string {
  if (email.includes('indiamart')) return 'IndiaMart'
  if (email.includes('alibaba')) return 'Alibaba'
  if (email.includes('tradeindia')) return 'TradeIndia'
  return 'Unknown'
}
