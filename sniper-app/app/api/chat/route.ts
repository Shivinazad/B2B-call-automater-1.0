import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const systemPrompt = `You are Aria, a sourcing agent. Help users find vendors for bulk production. Be warm, direct, and concise.

Gather these details — ask about only what is genuinely missing, ONE question at a time:
1. PRODUCT: What exactly are they sourcing (e.g. "Oversized Cotton Hoodie", "Glass Bottle 500ml", "Steel Screw M8")
2. SPECIFICATIONS: Ask ONE smart follow-up specific to the product type — e.g. for glass: size/capacity/colour; for electronics: specs/certifications; for clothing: fabric/GSM. DO NOT ask about fabric/material for non-textile products.
3. QUANTITY: How many units — ACCEPT ANY NUMBER, even 1. Never re-ask.
4. CUSTOMIZATION: Relevant customisation (logos, engravings, prints, labels — pick what makes sense for the product).
5. BUDGET & DEADLINE: Optional — ask both together in one line only if not already mentioned.

Rules:
- One short sentence per reply. No lists, no greetings.
- Never ask multiple questions in one message.
- Never re-ask anything already answered.
- NEVER push back on or question a quantity the user gave.
- Do NOT ask for email or phone.
- Once you have confident answers to 1 + 2 + 3, immediately emit FINISHED_JSON (don't wait for 4 or 5 if user hasn't mentioned them).

FINISHED_JSON format (valid JSON, always last line):
FINISHED_JSON:{"product": "<name>", "quantity": <number>, "specifications": "<relevant specs>", "budget": "<budget or null>", "deadline": "<deadline or null>"}`

    // Format history for Gemini
    const formattedHistory = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))

    // Add system prompt to the beginning if it doesn't support system instructions directly in this sdk version
    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "SYSTEM PROMPT (Follow this strictly):\n" + systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will act as the sourcing agent." }]
        },
        ...formattedHistory.slice(0, -1)
      ],
    })

    const latestMessage = messages[messages.length - 1].content
    let responseText = ""

    try {
      const result = await chatSession.sendMessage(latestMessage)
      responseText = result.response.text()
    } catch (geminiError: any) {
      console.warn("Gemini API failed, using fallback:", geminiError.message)
      
      // Smart rule-based fallback — drive conversation from user message history
      const userMsgs = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content as string)
      const allText = userMsgs.join(' ')
      const uCount = userMsgs.length

      if (uCount === 1) {
        // Ask a generic spec question, not hardcoded to fabric
        responseText = 'What size, capacity, or key specification do you need?'
      } else if (uCount === 2) {
        responseText = 'Any custom branding, labelling, or finish required?'
      } else if (uCount === 3) {
        responseText = 'What quantity are you looking to order, and do you have a budget or deadline in mind?'
      } else {
        // Extract what we can from the conversation
        const product = userMsgs[0].replace(/['"]/g, '').trim().slice(0, 80)
        const qtyMatch = allText.match(/\b(\d[\d,]*)\b/)
        const qty = qtyMatch ? parseInt(qtyMatch[1].replace(/,/g, '')) : 100
        const budgetMatch = allText.match(/(?:₹|rs\.?|inr|budget[:\s]+)[\s]*(\d[\d,k.lakh]*)/i)
        const budget = budgetMatch ? budgetMatch[1] : 'null'
        const deadlineMatch = allText.match(/\b(\d+\s*(?:days?|weeks?|months?)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d*)\b/i)
        const deadline = deadlineMatch ? `"${deadlineMatch[1]}"` : 'null'
        const specs = userMsgs.slice(1, 4).join(', ').replace(/"/g, "'").slice(0, 200)

        responseText = `Perfect, I have everything needed.\nFINISHED_JSON:{"product": "${product}", "quantity": ${qty}, "specifications": "${specs}", "budget": ${budget === 'null' ? 'null' : `"${budget}"`}, "deadline": ${deadline}}`
      }
    }

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
