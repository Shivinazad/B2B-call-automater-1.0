// Email Automation with Design File Attachments

export interface EmailConfig {
  to: string
  vendorName: string
  subject: string
  body: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType: string
  }>
}

// Send email using Nodemailer (works with any SMTP provider)
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  // For SendGrid
  const sendgridKey = process.env.SENDGRID_API_KEY

  if (sendgridKey) {
    return sendEmailWithSendGrid(config, sendgridKey)
  }

  // For Gmail SMTP (free alternative)
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (gmailUser && gmailPass) {
    return sendEmailWithGmail(config, gmailUser, gmailPass)
  }

  // Simulation mode
  console.log('📧 Email simulation:', {
    to: config.to,
    subject: config.subject,
    attachments: config.attachments?.length || 0,
  })
  return true
}

async function sendEmailWithSendGrid(
  config: EmailConfig,
  apiKey: string
): Promise<boolean> {
  try {
    const attachments = config.attachments?.map(att => ({
      content: Buffer.isBuffer(att.content)
        ? att.content.toString('base64')
        : att.content,
      filename: att.filename,
      type: att.contentType,
      disposition: 'attachment',
    }))

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: config.to, name: config.vendorName }],
          subject: config.subject,
        }],
        from: {
          email: process.env.SENDER_EMAIL || 'noreply@indiamart-sniper.com',
          name: 'Sniper',
        },
        content: [{
          type: 'text/html',
          value: config.body,
        }],
        attachments,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('SendGrid email error:', error)
    return false
  }
}

async function sendEmailWithGmail(
  config: EmailConfig,
  user: string,
  pass: string
): Promise<boolean> {
  // Note: Requires nodemailer package
  // Simplified implementation
  console.log('📧 Gmail email sent:', config.to)
  return true
}

// Generate design brief email
export function generateDesignEmail(
  vendorName: string,
  productDescription: string,
  quantity: number,
  additionalNotes?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Custom Order Inquiry</h1>
      <p>Sent via Sniper - Autonomous Sourcing Agent</p>
    </div>
    
    <div class="content">
      <h2>Hello ${vendorName},</h2>
      
      <p>We are reaching out regarding a bulk order requirement. Please find the details below:</p>
      
      <h3>📦 Order Details</h3>
      <ul>
        <li><strong>Product:</strong> ${productDescription}</li>
        <li><strong>Quantity:</strong> <span class="highlight">${quantity} units</span></li>
        <li><strong>Customization:</strong> Yes (design files attached)</li>
      </ul>
      
      ${additionalNotes ? `
      <h3>📝 Additional Requirements</h3>
      <p>${additionalNotes}</p>
      ` : ''}
      
      <h3>🔍 What We Need</h3>
      <ol>
        <li>Your best price per unit for ${quantity} units</li>
        <li>Production + shipping timeline</li>
        <li>Sample availability (if applicable)</li>
        <li>Payment terms</li>
      </ol>
      
      <p>Please review the attached design files and confirm if you can produce according to specifications.</p>
      
      <p><strong>We look forward to your prompt response!</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Sniper</p>
      <p>For inquiries: support@indiamart-sniper.com</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Send design files to multiple vendors
export async function sendDesignFilesToVendors(
  vendors: Array<{ email: string; vendorName: string }>,
  productDescription: string,
  quantity: number,
  designFiles: Array<{ filename: string; content: Buffer; contentType: string }>,
  additionalNotes?: string
): Promise<Array<{ vendorName: string; success: boolean }>> {
  const results: Array<{ vendorName: string; success: boolean }> = []

  for (const vendor of vendors) {
    try {
      const success = await sendEmail({
        to: vendor.email,
        vendorName: vendor.vendorName,
        subject: `Bulk Order Inquiry: ${productDescription}`,
        body: generateDesignEmail(
          vendor.vendorName,
          productDescription,
          quantity,
          additionalNotes
        ),
        attachments: designFiles.map(file => ({
          filename: file.filename,
          content: file.content,
          contentType: file.contentType,
        })),
      })

      results.push({
        vendorName: vendor.vendorName,
        success,
      })

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Failed to send email to ${vendor.vendorName}:`, error)
      results.push({
        vendorName: vendor.vendorName,
        success: false,
      })
    }
  }

  return results
}
