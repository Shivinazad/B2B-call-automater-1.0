// @ts-nocheck
// Freemium Pricing & Payment Integration
// Stripe for international, Razorpay for India

import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Pricing plans
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: [
      '5 sourcing runs per month',
      '10 India vendor calls (free)',
      'Email to 5 vendors',
      'Basic AI insights',
      'Community support',
    ],
    limits: {
      sourcingRuns: 5,
      indiaCalls: 10,
      intlCalls: 0,
      emailVendors: 5,
    },
  },
  STARTER: {
    name: 'Starter',
    price: 1499, // ₹1,499/month (~$18)
    priceUSD: 19,
    currency: 'INR',
    interval: 'month',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    razorpayPlanId: process.env.RAZORPAY_STARTER_PLAN_ID,
    features: [
      '50 sourcing runs per month',
      '100 India vendor calls (free)',
      '20 international calls included',
      'Email to unlimited vendors',
      'Advanced AI analysis',
      'Call recordings & transcripts',
      'Priority support',
    ],
    limits: {
      sourcingRuns: 50,
      indiaCalls: 100,
      intlCalls: 20,
      emailVendors: 999999,
    },
  },
  PRO: {
    name: 'Pro',
    price: 3999, // ₹3,999/month (~$48)
    priceUSD: 49,
    currency: 'INR',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID,
    features: [
      'Unlimited sourcing runs',
      'Unlimited India calls (free)',
      '100 international calls included',
      'Priority vendor calling',
      'Gemini AI insights',
      'Export to PDF/Excel',
      'API access',
      'Dedicated support',
    ],
    limits: {
      sourcingRuns: 999999,
      indiaCalls: 999999,
      intlCalls: 100,
      emailVendors: 999999,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Contact sales
    features: [
      'Everything in Pro',
      'Unlimited international calls',
      'Custom AI training',
      'White-label solution',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
      'Volume discounts',
    ],
  },
}

// Create Stripe checkout session
export async function createStripeCheckout(
  userId: string,
  userEmail: string,
  plan: 'STARTER' | 'PRO'
): Promise<{ sessionId: string; url: string }> {
  const planDetails = PRICING_PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: planDetails.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    metadata: {
      userId,
      plan,
    },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}

// Create Razorpay subscription (for Indian customers)
export async function createRazorpaySubscription(
  userId: string,
  userEmail: string,
  plan: 'STARTER' | 'PRO'
): Promise<{ subscriptionId: string; shortUrl: string }> {
  const razorpayKey = process.env.RAZORPAY_KEY_ID!
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!
  const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')

  const planDetails = PRICING_PLANS[plan]

  // Create subscription
  const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planDetails.razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 months
      notes: {
        userId,
        plan,
        email: userEmail,
      },
    }),
  })

  const data = await response.json()

  return {
    subscriptionId: data.id,
    shortUrl: data.short_url,
  }
}

// Buy credits (pay-as-you-go for international calls)
export async function createCreditsPurchase(
  userId: string,
  userEmail: string,
  credits: number, // Number of credits to purchase
  paymentMethod: 'stripe' | 'razorpay'
): Promise<{ sessionId?: string; orderId?: string; url: string }> {
  const pricePerCredit = 10 // ₹10 per credit = 1 minute intl call
  const amount = credits * pricePerCredit

  if (paymentMethod === 'stripe') {
    // Stripe one-time payment
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${credits} Credits`,
              description: 'Pay-as-you-go credits for international calls',
            },
            unit_amount: amount * 100, // Convert to paise
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?credits=cancelled`,
      metadata: {
        userId,
        credits: credits.toString(),
        type: 'credits',
      },
    })

    return {
      sessionId: session.id,
      url: session.url!,
    }
  } else {
    // Razorpay one-time payment
    const razorpayKey = process.env.RAZORPAY_KEY_ID!
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!
    const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `credits_${userId}_${Date.now()}`,
        notes: {
          userId,
          credits: credits.toString(),
          type: 'credits',
        },
      }),
    })

    const data = await response.json()

    // Generate payment page URL (you'll need to create this page)
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/razorpay?order_id=${data.id}`

    return {
      orderId: data.id,
      url: paymentUrl,
    }
  }
}

// Handle Stripe webhook
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.mode === 'subscription') {
        // Subscription created
        const userId = session.client_reference_id!
        const plan = session.metadata?.plan as 'STARTER' | 'PRO'
        
        // Update user subscription in database
        await updateUserSubscription(userId, plan, session.id, session.customer as string)
      } else if (session.metadata?.type === 'credits') {
        // Credits purchased
        const userId = session.client_reference_id!
        const credits = parseInt(session.metadata.credits)
        
        await addUserCredits(userId, credits, session.id)
      }
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      // Handle subscription cancellation
      await handleSubscriptionCancelled(subscription.metadata.userId)
      break

    case 'invoice.payment_failed':
      // Handle failed payment
      const invoice = event.data.object as Stripe.Invoice
      console.error('Payment failed for customer:', invoice.customer)
      break
  }
}

// Database update functions (placeholder - implement with Prisma)
async function updateUserSubscription(
  userId: string,
  plan: 'STARTER' | 'PRO',
  subscriptionId: string,
  stripeCustomerId: string
) {
  // TODO: Implement with Prisma
  console.log(`Update user ${userId} to ${plan} plan`)
}

async function addUserCredits(userId: string, credits: number, paymentId: string) {
  // TODO: Implement with Prisma
  console.log(`Add ${credits} credits to user ${userId}`)
}

async function handleSubscriptionCancelled(userId: string) {
  // TODO: Implement with Prisma
  console.log(`Cancel subscription for user ${userId}`)
}

// Calculate call cost and check if user can afford it
export function calculateCallCost(
  countryCode: string,
  estimatedDuration: number = 120 // seconds
): { cost: number; credits: number } {
  const rates = {
    '+91': 0, // India - FREE
    '+86': 2.5, // China - ₹2.5/min
    '+1': 3.0, // USA - ₹3/min
    '+44': 3.5, // UK - ₹3.5/min
    '+971': 4.0, // UAE - ₹4/min
    default: 4.0, // Others - ₹4/min
  }

  const minutes = Math.ceil(estimatedDuration / 60)
  const ratePerMin = rates[countryCode as keyof typeof rates] || rates.default
  const cost = ratePerMin * minutes
  const credits = Math.ceil(cost / 10) // 1 credit = ₹10

  return { cost, credits }
}
