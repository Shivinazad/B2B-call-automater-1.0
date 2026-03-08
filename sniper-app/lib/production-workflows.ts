// @ts-nocheck
// Example: Complete workflow using new production features
// This shows how all pieces fit together

import { analyzeVendorWithGemini, compareVendorsWithGemini } from '@/lib/gemini-ai'
import { scrapeAllPlatformsV2 } from '@/lib/scrapers-v2-production'
import { makeVerifiedVapiCall } from '@/lib/verified-calling'
import { checkUserLimits, incrementUsage } from '@/lib/auth-config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// EXAMPLE 1: Complete sourcing workflow for authenticated user
export async function runProductionSourcingWorkflow(
  userId: string,
  requirement: {
    productDescription: string
    quantity: number
    targetPrice?: number
    customization?: string
  }
) {
  console.log(`🚀 Starting sourcing for user ${userId}`)

  // Step 1: Check if user is allowed to run sourcing
  const limitCheck = await checkUserLimits(userId, 'sourcing_run')
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason)
  }

  // Step 2: Create sourcing run in database
  const sourcingRun = await prisma.sourcingRun.create({
    data: {
      userId,
      productDescription: requirement.productDescription,
      quantity: requirement.quantity,
      targetPrice: requirement.targetPrice,
      targetCurrency: 'INR',
      customization: requirement.customization,
      status: 'SCRAPING',
    },
  })

  console.log(`📊 Created sourcing run: ${sourcingRun.id}`)

  // Step 3: Scrape 10 platforms in parallel
  const vendors = await scrapeAllPlatformsV2(
    requirement.productDescription,
    requirement.quantity
  )

  console.log(`✅ Found ${vendors.length} vendors from 10 platforms`)

  // Step 4: Save vendors to database
  await prisma.vendor.createMany({
    data: vendors.map(v => ({
      sourcingRunId: sourcingRun.id,
      vendorName: v.vendorName,
      platform: v.platform,
      contactEmail: v.contactEmail,
      phoneNumber: v.phoneNumber,
      whatsappNumber: v.whatsappNumber,
      website: v.website,
      location: v.location,
      price: v.price,
      currency: v.currency,
      moq: v.moq,
      rating: v.rating,
      reviews: v.reviews,
      verified: v.verified,
      responseRate: v.responseRate,
    })),
  })

  // Step 5: Analyze vendors with Gemini AI
  console.log('🤖 Analyzing vendors with Google Gemini...')
  const vendorAnalyses = await Promise.all(
    vendors.slice(0, 10).map(v => analyzeVendorWithGemini(v))
  )

  // Update vendors with AI insights
  for (let i = 0; i < Math.min(10, vendors.length); i++) {
    const analysis = vendorAnalyses[i]
    await prisma.vendor.updateMany({
      where: {
        sourcingRunId: sourcingRun.id,
        vendorName: vendors[i].vendorName,
      },
      data: {
        qualityScore: analysis.qualityScore,
        reliabilityScore: analysis.reliabilityScore,
        priceCompetitiveness: analysis.priceCompetitiveness,
        recommendationLevel: analysis.recommendationLevel,
        aiInsights: JSON.stringify({
          insights: analysis.insights,
          risks: analysis.risks,
          strengths: analysis.strengths,
        }),
      },
    })
  }

  // Step 6: Compare and rank vendors
  const comparison = await compareVendorsWithGemini(vendors.slice(0, 10))
  console.log(`🏆 Best vendor: ${comparison.bestOverall}`)

  // Step 7: Update sourcing run status
  await prisma.sourcingRun.update({
    where: { id: sourcingRun.id },
    data: {
      status: 'CALLING',
      vendorsFound: vendors.length,
    },
  })

  // Step 8: Increment user usage
  await incrementUsage(userId, 'sourcing_run')

  console.log(`✅ Sourcing workflow complete!`)

  return {
    sourcingRunId: sourcingRun.id,
    vendorsFound: vendors.length,
    topVendors: comparison.rankings.slice(0, 5),
    bestOverall: comparison.bestOverall,
    bestValue: comparison.bestValue,
  }
}

// EXAMPLE 2: Call vendor with verification
export async function callVendorWithVerification(
  userId: string,
  sourcingRunId: string,
  vendorId: string
) {
  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      subscriptionTier: true,
      credits: true,
    },
  })

  if (!user) throw new Error('User not found')

  // Get vendor details
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  })

  if (!vendor || !vendor.phoneNumber) {
    throw new Error('Vendor or phone number not found')
  }

  // Get sourcing run details
  const sourcingRun = await prisma.sourcingRun.findUnique({
    where: { id: sourcingRunId },
  })

  if (!sourcingRun) throw new Error('Sourcing run not found')

  // Extract country code from phone number
  const countryCode = vendor.phoneNumber.substring(0, 3) // e.g., "+91"

  // Check if user can make this call
  const callType = countryCode === '+91' ? 'india_call' : 'intl_call'
  const limitCheck = await checkUserLimits(userId, callType)

  if (!limitCheck.allowed) {
    throw new Error(limitCheck.reason || 'Call limit reached')
  }

  console.log(`📞 Calling ${vendor.vendorName} at ${vendor.phoneNumber}`)

  // Make verified call
  const callResult = await makeVerifiedVapiCall({
    phoneNumber: vendor.phoneNumber,
    vendorName: vendor.vendorName,
    productDescription: sourcingRun.productDescription,
    quantity: sourcingRun.quantity,
    countryCode,
    userEmail: user.email!,
    isPremium: user.subscriptionTier !== 'FREE',
  })

  console.log(`✅ Call completed: ${callResult.status}`)
  console.log(`💰 Cost: ₹${callResult.cost}`)

  // Save call log to database
  await prisma.callLog.create({
    data: {
      userId,
      sourcingRunId,
      vendorId,
      callId: callResult.callId,
      phoneNumber: vendor.phoneNumber,
      countryCode,
      duration: callResult.duration,
      status: callResult.status.toUpperCase() as any,
      cost: callResult.cost,
      recordingUrl: callResult.recording_url,
      transcript: callResult.transcript,
      numberVerified: callResult.callVerification.numberVerified,
      vendorConfirmed: callResult.callVerification.vendorConfirmed,
      vendorResponse: callResult.vendorResponse.toUpperCase() as any,
    },
  })

  // Update sourcing run call count
  await prisma.sourcingRun.update({
    where: { id: sourcingRunId },
    data: { callsMade: { increment: 1 } },
  })

  // Increment user call usage and deduct credits if needed
  await incrementUsage(userId, 'call', callResult.cost)

  return callResult
}

// EXAMPLE 3: Get user dashboard data
export async function getUserDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sourcingRuns: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          vendors: {
            orderBy: { rating: 'desc' },
            take: 5,
          },
          callLogs: {
            where: { status: 'COMPLETED' },
          },
        },
      },
      callLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!user) throw new Error('User not found')

  // Calculate statistics
  const totalSourcingRuns = await prisma.sourcingRun.count({
    where: { userId },
  })

  const totalCallsMade = await prisma.callLog.count({
    where: { userId },
  })

  const successfulCalls = await prisma.callLog.count({
    where: { userId, status: 'COMPLETED' },
  })

  const totalSpent = await prisma.payment.aggregate({
    where: { userId, status: 'COMPLETED' },
    _sum: { amount: true },
  })

  return {
    user: {
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      credits: user.credits,
      sourcingRunsThisMonth: user.sourcingRunsThisMonth,
      callsThisMonth: user.callsThisMonth,
    },
    stats: {
      totalSourcingRuns,
      totalCallsMade,
      successfulCalls,
      callSuccessRate: totalCallsMade > 0 ? (successfulCalls / totalCallsMade) * 100 : 0,
      totalSpent: totalSpent._sum.amount || 0,
    },
    recentSourcingRuns: user.sourcingRuns.map(run => ({
      id: run.id,
      productDescription: run.productDescription,
      quantity: run.quantity,
      status: run.status,
      vendorsFound: run.vendorsFound,
      callsMade: run.callsMade,
      createdAt: run.createdAt,
      topVendors: run.vendors.slice(0, 3).map(v => ({
        name: v.vendorName,
        platform: v.platform,
        rating: v.rating,
        price: v.price,
        currency: v.currency,
      })),
    })),
    recentCalls: user.callLogs.map(call => ({
      id: call.id,
      phoneNumber: call.phoneNumber,
      duration: call.duration,
      status: call.status,
      cost: call.cost,
      vendorResponse: call.vendorResponse,
      recordingUrl: call.recordingUrl,
      createdAt: call.createdAt,
    })),
  }
}

// EXAMPLE 4: Check if user should see upgrade prompt
export async function shouldShowUpgradePrompt(userId: string): Promise<{
  show: boolean
  reason?: string
  recommendedPlan?: 'STARTER' | 'PRO'
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) return { show: false }

  // Already on paid plan
  if (user.subscriptionTier !== 'FREE') {
    return { show: false }
  }

  // Close to limits
  if (user.sourcingRunsThisMonth >= 4) {
    return {
      show: true,
      reason: 'You have used 4 of 5 free sourcing runs this month',
      recommendedPlan: 'STARTER',
    }
  }

  if (user.callsThisMonth >= 8) {
    return {
      show: true,
      reason: 'You have used 8 of 10 free calls this month',
      recommendedPlan: 'STARTER',
    }
  }

  // Has tried international call but doesn't have credits
  const intlCallAttempts = await prisma.callLog.count({
    where: {
      userId,
      status: 'FAILED',
      countryCode: { not: '+91' },
    },
  })

  if (intlCallAttempts > 0 && user.credits < 10) {
    return {
      show: true,
      reason: 'Upgrade to call international vendors',
      recommendedPlan: 'STARTER',
    }
  }

  return { show: false }
}

// EXAMPLE 5: Analytics for admin dashboard
export async function getAdminAnalytics(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const analytics = await prisma.analytics.findMany({
    where: {
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  })

  const totalUsers = await prisma.user.count()
  const paidUsers = await prisma.user.count({
    where: {
      subscriptionTier: { not: 'FREE' },
    },
  })

  const totalRevenue = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate },
    },
    _sum: { amount: true },
  })

  const avgRevenuePerUser = paidUsers > 0 ? (totalRevenue._sum.amount || 0) / paidUsers : 0

  return {
    dailyAnalytics: analytics,
    summary: {
      totalUsers,
      paidUsers,
      freeUsers: totalUsers - paidUsers,
      conversionRate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      avgRevenuePerUser,
      mrr: avgRevenuePerUser * paidUsers,
    },
  }
}

// Export all functions
export {
  runProductionSourcingWorkflow,
  callVendorWithVerification,
  getUserDashboardData,
  shouldShowUpgradePrompt,
  getAdminAnalytics,
}
