import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/call-status?callId=xxx
 *
 * Proxies to Bland AI to check if a live call has completed.
 * The orchestrator polls this every 5s during the voice-calls step so the
 * workflow only advances once the real phone call has ended.
 */
export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get('callId')
  const BLAND_API_KEY = process.env.BLAND_API_KEY

  if (!callId) {
    return NextResponse.json({ status: 'unknown', error: 'callId required' }, { status: 400 })
  }

  if (!BLAND_API_KEY) {
    // No Bland key configured — tell orchestrator the call is done (demo mode)
    return NextResponse.json({ status: 'completed', duration: 0 })
  }

  try {
    const res = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: { authorization: BLAND_API_KEY },
      // 8-second server timeout so polling doesn't block
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json({ status: 'unknown', httpStatus: res.status })
    }

    const data = await res.json()

    // Bland AI possible statuses: 'queued', 'in-progress', 'completed', 'failed', 'error'
    const doneStatuses = ['completed', 'failed', 'error']
    const isDone = doneStatuses.includes(data.status)

    return NextResponse.json({
      status: data.status,
      isDone,
      duration: data.call_length ?? null,
      transcript: data.concatenated_transcript ?? null,
    })
  } catch (err) {
    console.error('call-status proxy error:', err)
    // On network error, return unknown so orchestrator keeps polling
    return NextResponse.json({ status: 'unknown' })
  }
}
