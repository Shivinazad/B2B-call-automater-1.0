// @ts-nocheck
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            subscriptionTier: true,
            credits: true,
            sourcingRunsThisMonth: true,
            callsThisMonth: true,
          },
        })

        session.user.id = user.id
        session.user.subscriptionTier = dbUser?.subscriptionTier || 'FREE'
        session.user.credits = dbUser?.credits || 0
        session.user.sourcingRunsThisMonth = dbUser?.sourcingRunsThisMonth || 0
        session.user.callsThisMonth = dbUser?.callsThisMonth || 0
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Track new user signup
      if (user && !user.emailVerified) {
        await prisma.analytics.upsert({
          where: { date: new Date() },
          update: { newSignups: { increment: 1 } },
          create: {
            date: new Date(),
            newSignups: 1,
            totalUsers: 1,
          },
        })
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async createUser({ user }) {
      // Initialize new user with FREE tier
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          credits: 10, // Welcome bonus: 10 credits = 1 free intl call
        },
      })
    },
  },
}

// Helper function to check subscription limits
export async function checkUserLimits(userId: string, action: 'sourcing_run' | 'india_call' | 'intl_call'): Promise<{
  allowed: boolean
  reason?: string
  upgradeRequired?: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      credits: true,
      sourcingRunsThisMonth: true,
      callsThisMonth: true,
      lastResetDate: true,
    },
  })

  if (!user) {
    return { allowed: false, reason: 'User not found' }
  }

  // Check if we need to reset monthly counters
  const now = new Date()
  const lastReset = new Date(user.lastResetDate)
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        sourcingRunsThisMonth: 0,
        callsThisMonth: 0,
        lastResetDate: now,
      },
    })
    user.sourcingRunsThisMonth = 0
    user.callsThisMonth = 0
  }

  const limits = {
    FREE: { sourcingRuns: 5, indiaCalls: 10, intlCalls: 0 },
    STARTER: { sourcingRuns: 50, indiaCalls: 100, intlCalls: 20 },
    PRO: { sourcingRuns: 999999, indiaCalls: 999999, intlCalls: 100 },
    ENTERPRISE: { sourcingRuns: 999999, indiaCalls: 999999, intlCalls: 999999 },
  }

  const userLimits = limits[user.subscriptionTier as keyof typeof limits]

  switch (action) {
    case 'sourcing_run':
      if (user.sourcingRunsThisMonth >= userLimits.sourcingRuns) {
        return {
          allowed: false,
          reason: `Monthly limit reached (${userLimits.sourcingRuns} sourcing runs)`,
          upgradeRequired: true,
        }
      }
      return { allowed: true }

    case 'india_call':
      if (user.callsThisMonth >= userLimits.indiaCalls) {
        return {
          allowed: false,
          reason: `Monthly call limit reached (${userLimits.indiaCalls} India calls)`,
          upgradeRequired: true,
        }
      }
      return { allowed: true }

    case 'intl_call':
      // Check if user has credits or tier allows intl calls
      if (user.subscriptionTier === 'FREE') {
        if (user.credits < 10) {
          return {
            allowed: false,
            reason: 'International calls require premium subscription or credits',
            upgradeRequired: true,
          }
        }
        return { allowed: true } // User has credits
      }

      if (user.callsThisMonth >= userLimits.intlCalls) {
        return {
          allowed: false,
          reason: `Monthly international call limit reached (${userLimits.intlCalls})`,
          upgradeRequired: true,
        }
      }
      return { allowed: true }

    default:
      return { allowed: false }
  }
}

// Increment usage counters
export async function incrementUsage(
  userId: string,
  action: 'sourcing_run' | 'call',
  cost?: number
): Promise<void> {
  if (action === 'sourcing_run') {
    await prisma.user.update({
      where: { id: userId },
      data: { sourcingRunsThisMonth: { increment: 1 } },
    })
  } else if (action === 'call') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        callsThisMonth: { increment: 1 },
        credits: cost && cost > 0 ? { decrement: Math.ceil(cost) } : undefined,
      },
    })
  }

  // Update analytics
  await prisma.analytics.upsert({
    where: { date: new Date() },
    update: {
      activeUsers: { increment: 1 },
      sourcingRuns: action === 'sourcing_run' ? { increment: 1 } : undefined,
      callsMade: action === 'call' ? { increment: 1 } : undefined,
    },
    create: {
      date: new Date(),
      activeUsers: 1,
      sourcingRuns: action === 'sourcing_run' ? 1 : 0,
      callsMade: action === 'call' ? 1 : 0,
    },
  })
}
