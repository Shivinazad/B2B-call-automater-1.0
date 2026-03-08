import { NextRequest, NextResponse } from 'next/server'
import { sendDesignEmail } from '@/lib/apiIntegrations'

export async function POST(request: NextRequest) {
  try {
    const { vendors, designFiles } = await request.json()

    const emailResults = []

    for (const vendor of vendors) {
      const result = await sendDesignEmail(
        vendor.email,
        vendor.vendorName,
        designFiles
      )

      emailResults.push({
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        ...result,
      })
    }

    return NextResponse.json({ success: true, emails: emailResults })
  } catch (error) {
    console.error('Send designs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send design files' },
      { status: 500 }
    )
  }
}
