'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSourcingStore, UserRequirement } from '@/store/sourcingStore'
import { Send, Loader2, Bot, Sparkles } from 'lucide-react'

type Message = {
  role: 'user' | 'ai'
  content: string
}

export default function ChatInterface() {
  const { setUserRequirement, setWorkflowState, setCurrentMessages } = useSourcingStore()
  
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hi! I\'m Aria, your sourcing agent. Tell me — what are you looking to manufacture or source?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return
    
    const userMessage = query
    setQuery('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }]
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("Chat API returned error:", data.error)
        setMessages(prev => [...prev, { role: 'ai', content: `API Error: ${data.error}` }])
      } else if (data.response) {
        if (data.response.includes('FINISHED_JSON:')) {
          const [chatText, jsonStr] = data.response.split('FINISHED_JSON:')
          
          if (chatText.trim()) {
            setMessages(prev => [...prev, { role: 'ai', content: chatText.trim() }])
          }

          try {
            const extracted = JSON.parse(jsonStr.trim())

            // --- Budget parsing: handle "50k", "1 lakh", "2L", "₹50,000" etc. ---
            const parseBudget = (raw: any): number | undefined => {
              if (!raw || raw === 'null') return undefined
              const s = String(raw).toLowerCase().trim()
              const num = parseFloat(s.replace(/[^0-9.]/g, ''))
              if (isNaN(num)) return undefined
              if (s.includes('lakh') || s.includes('lac') || /[0-9]l$/.test(s)) return Math.round(num * 100000)
              if (s.includes('k')) return Math.round(num * 1000)
              if (s.includes('cr') || s.includes('crore')) return Math.round(num * 10000000)
              return num
            }

            // --- Quantity: guard against NaN, strip commas ---
            const parseQty = (raw: any): number => {
              const n = parseInt(String(raw ?? '').replace(/[^0-9]/g, ''), 10)
              return isNaN(n) || n <= 0 ? 100 : n
            }

            const productDesc = [extracted.product, extracted.specifications]
              .filter(Boolean)
              .join(' — ')
            const requirement: UserRequirement = {
              productDescription: productDesc || 'Custom product sourcing',
              quantity: parseQty(extracted.quantity),
              customDesign: false,
              designFiles: [],
              budget: parseBudget(extracted.budget),
              deadline: extracted.deadline && extracted.deadline !== 'null'
                ? extracted.deadline
                : undefined,
            }
            setUserRequirement(requirement)
            // Persist messages so AutomationFeed can save them with the final results
            setCurrentMessages([...messages, { role: 'user', content: userMessage }])
            setTimeout(() => setWorkflowState('pre-flight'), 1500)
          } catch (e) {
            console.error("Failed to parse completion JSON", e)
            setMessages(prev => [...prev, { role: 'ai', content: "Perfect — I have everything I need. Let me prepare your sourcing brief." }])
            setTimeout(() => setWorkflowState('pre-flight'), 1500)
          }

        } else {
          setMessages(prev => [...prev, { role: 'ai', content: data.response }])
        }
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection issue. Please ensure Gemini API key is correct.' }])
    }
    
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[70vh] relative">
      {/* Header */}
      <div className="text-center mb-8 flex-shrink-0">
        <h2 className="text-4xl md:text-5xl font-serif italic mb-3 text-brand-dark tracking-tight">
          What are we building?
        </h2>
        <p className="text-brand-orange font-medium text-sm tracking-wide">CONVERSATIONAL SOURCING AGENT</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-brand-peach/30 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-brand-orange" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-brand-orange to-brand-peach text-white shadow-md rounded-br-none' 
                  : 'bg-white border border-brand-border text-brand-dark shadow-sm rounded-bl-none'
              }`}>
                <p className="leading-relaxed text-[15px]">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-peach/30 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                <Bot className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="bg-white border border-brand-border rounded-2xl rounded-bl-none px-6 py-4 shadow-sm flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-orange to-brand-peach rounded-[24px] blur-md opacity-20 transition duration-500"></div>
        <form 
          onSubmit={handleSubmit}
          className="relative bg-white rounded-[20px] p-2 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-brand-border"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your requirements here..."
            className="w-full bg-transparent text-[16px] px-5 py-4 text-brand-dark placeholder-gray-400 focus:outline-none resize-none h-[60px] font-medium"
            autoFocus
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-brand-dark text-white flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0 mr-1"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  )
}
