import { NextRequest, NextResponse } from 'next/server'
import {
  generateCertificateHTML,
  generateCertificateId,
  type CertificateData,
} from '@/lib/certificateGenerator'

export async function POST(request: NextRequest) {
  try {
    const data: CertificateData = await request.json()

    // Generate certificate ID if not provided
    if (!data.certificateId) {
      data.certificateId = generateCertificateId()
    }

    // Generate HTML certificate
    const html = generateCertificateHTML(data)

    // Return HTML that can be opened in new window or converted to PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="steam-deal-${data.certificateId}.html"`,
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
