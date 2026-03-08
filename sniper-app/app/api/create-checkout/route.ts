// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createStripeCheckout, createRazorpaySubscription } from '@/lib/pricing-payments'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, paymentMethod } = await request.json()

    if (!['STARTER', 'PRO'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!['stripe', 'razorpay'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Create checkout session based on payment method
    if (paymentMethod === 'stripe') {
      const checkout = await createStripeCheckout(
        session.user.id,
        session.user.email!,
        plan
      )
      return NextResponse.json({ url: checkout.url })
    } else {
      const subscription = await createRazorpaySubscription(
        session.user.id,
        session.user.email!,
        plan
      )
      return NextResponse.json({ url: subscription.shortUrl })
    }
  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
