import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { vendors, callResults } = await request.json()

    // Categorize vendors
    const categorized = categorizeVendors(vendors)

    return NextResponse.json({ success: true, vendors: categorized })
  } catch (error) {
    console.error('Analyze results error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze results' },
      { status: 500 }
    )
  }
}

function categorizeVendors(vendors: any[]) {
  if (vendors.length === 0) return vendors

  // Find best in each category
  const cheapestIndex = vendors.reduce(
    (minIdx, vendor, idx, arr) => 
      (vendor.priceAfterCall || vendor.priceInINR) < (arr[minIdx].priceAfterCall || arr[minIdx].priceInINR)
        ? idx
        : minIdx,
    0
  )

  const bestReviewedIndex = vendors.reduce(
    (maxIdx, vendor, idx, arr) => {
      const score = vendor.rating * Math.log(vendor.reviews + 1)
      const maxScore = arr[maxIdx].rating * Math.log(arr[maxIdx].reviews + 1)
      return score > maxScore ? idx : maxIdx
    },
    0
  )

  const fastestIndex = vendors.reduce(
    (minIdx, vendor, idx, arr) =>
      vendor.shippingDays < arr[minIdx].shippingDays ? idx : minIdx,
    0
  )

  // Best service based on rating and call success
  const bestServiceIndex = vendors.reduce(
    (maxIdx, vendor, idx, arr) => {
      const score = vendor.rating * (vendor.callStatus === 'completed' ? 1.2 : 1)
      const maxScore = arr[maxIdx].rating * (arr[maxIdx].callStatus === 'completed' ? 1.2 : 1)
      return score > maxScore ? idx : maxIdx
    },
    0
  )

  // Create a copy to avoid mutation
  const result = vendors.map(v => ({ ...v }))

  result[cheapestIndex].category = 'cheapest'
  result[bestReviewedIndex].category = 'best-reviewed'
  result[fastestIndex].category = 'fastest'
  result[bestServiceIndex].category = 'best-service'

  return result
}
