// PDF Certificate Generation using jsPDF

export interface CertificateData {
  vendorName: string
  platform: string
  pricePerUnit: number
  currency: string
  totalSavings: number
  verifiedDate: string
  certificateId: string
  productDescription: string
  quantity: number
}

// Generate Steam Deal Certificate PDF (client-side compatible)
export function generateCertificatePDF(data: CertificateData): void {
  // jsPDF implementation for client-side
  // This is a placeholder - actual implementation needs jsPDF import
  
  const certificateHTML = generateCertificateHTML(data)
  
  // For now, trigger HTML print
  // In production, use jsPDF or react-pdf
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(certificateHTML)
    printWindow.document.close()
    printWindow.print()
  }
}

// Generate Certificate as HTML (can be converted to PDF)
export function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Steam Deal Certificate - ${data.certificateId}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      background: #fff;
      padding: 60px;
    }
    .certificate {
      border: 8px solid #8b5cf6;
      padding: 50px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .ornament {
      text-align: center;
      font-size: 80px;
      color: #fbbf24;
      margin-bottom: 20px;
    }
    h1 {
      text-align: center;
      font-size: 48px;
      color: #7c3aed;
      margin-bottom: 10px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .subtitle {
      text-align: center;
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 40px;
      font-style: italic;
    }
    .declaration {
      text-align: center;
      font-size: 16px;
      color: #374151;
      margin-bottom: 40px;
      line-height: 1.8;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    .details {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 30px;
      margin: 40px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .detail-value {
      font-weight: bold;
      color: #111827;
      font-size: 18px;
    }
    .highlight {
      color: #10b981;
      font-size: 36px;
    }
    .savings {
      color: #059669;
      font-size: 32px;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
    }
    .certificate-id {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 15px;
    }
    .signature {
      font-style: italic;
      color: #6b7280;
      margin-top: 20px;
    }
    .seal {
      width: 100px;
      height: 100px;
      border: 4px solid #8b5cf6;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="ornament">🏆</div>
    
    <h1>STEAM DEAL CERTIFICATE</h1>
    <p class="subtitle">The Absolute Best Market Price</p>
    
    <p class="declaration">
      This certificate verifies that the following vendor has been 
      identified through our AI-powered autonomous sourcing system as 
      offering the <strong>best market price</strong> for the specified product.
    </p>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Product</span>
        <span class="detail-value">${data.productDescription}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Quantity</span>
        <span class="detail-value">${data.quantity} units</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Vendor Name</span>
        <span class="detail-value">${data.vendorName}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Platform</span>
        <span class="detail-value">${data.platform}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Best Price Per Unit</span>
        <span class="detail-value highlight">${data.currency} ${data.pricePerUnit}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Total Market Savings</span>
        <span class="detail-value savings">${data.currency} ${data.totalSavings}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Verification Date</span>
        <span class="detail-value">${data.verifiedDate}</span>
      </div>
    </div>
    
    <div class="footer">
      <div class="seal">✓</div>
      
      <p class="certificate-id">
        Certificate ID: ${data.certificateId}
      </p>
      
      <p style="font-weight: 600; color: #374151;">
        Verified by Sniper
      </p>
      <p class="signature">
        Autonomous Global Sourcing Agent
      </p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
        This certificate is valid as of the verification date above.<br>
        Prices subject to vendor confirmation and market conditions.
      </p>
    </div>
  </div>
  
  <script>
    // Auto-print when loaded
    window.onload = function() {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>
  `.trim()
}

// Generate certificate ID
export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `IMS-${timestamp}-${random}`
}

// Server-side PDF generation (for API endpoint)
export async function generateCertificatePDFBuffer(data: CertificateData): Promise<Buffer> {
  // This would use puppeteer or similar to convert HTML to PDF
  // For now, return the HTML as a buffer
  const html = generateCertificateHTML(data)
  return Buffer.from(html, 'utf-8')
}
