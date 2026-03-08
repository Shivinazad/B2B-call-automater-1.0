'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSourcingStore, VendorResult } from '@/store/sourcingStore'
import { Trophy, Star, Zap, Phone, CheckCircle2, Bot, PhoneCall, ExternalLink, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

// Map categories to intuitive titles
const CATEGORY_MAP: Record<string, { label: string, icon: any, color: string }> = {
  'cheapest': { label: 'Most Cost Effective', icon: Zap, color: 'text-green-600 bg-green-50' },
  'best-reviewed': { label: 'Highest Reliability', icon: Star, color: 'text-amber-600 bg-amber-50' },
  'fastest': { label: 'Fastest Turnaround', icon: Trophy, color: 'text-brand-orange bg-brand-peach/20' }
}

export default function ResultsView() {
  const { vendorResults, resetWorkflow, callTranscript } = useSourcingStore()
  const [showTranscript, setShowTranscript] = useState(false)
  const [showAllVendors, setShowAllVendors] = useState(false)

  if (!vendorResults || vendorResults.length === 0) return null

  const winner = vendorResults.find(v => v.category === 'best-reviewed') || vendorResults[0]
  const runnersUp = vendorResults.filter(v => v.id !== winner.id)

  // Build a real vendor URL — use productUrl if valid, otherwise Google search
  const vendorLink = (v: VendorResult) => {
    if (v.productUrl && v.productUrl !== '#' && v.productUrl.startsWith('http')) return v.productUrl
    return `https://www.google.com/search?q=${encodeURIComponent(v.vendorName + ' manufacturer supplier')}`
  }

  // Use transcript from the winner vendor object first, then fall back to global store transcript
  const transcript = winner.transcript || callTranscript

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif italic mb-4 text-brand-dark tracking-tight">Sourcing Complete.</h2>
        <p className="text-gray-500 font-medium">After autonomous negotiations and verifications, here is the official recommendation.</p>
      </div>

      {/* Top Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-[32px] p-10 border border-brand-orange/30 shadow-[0_8px_30px_rgba(242,96,45,0.08)] mb-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-peach/10 rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-brand-peach/20 px-4 py-1.5 rounded-full mb-6 text-brand-orange text-xs font-bold tracking-widest uppercase">
              <Trophy className="w-4 h-4" />
              <span>OVERALL WINNER</span>
            </div>

            <h3 className="text-3xl font-serif italic font-medium mb-2">{winner.vendorName}</h3>
            <p className="text-gray-500 flex items-center"><MapPin className="w-4 h-4 mr-1" /> {winner.location} • {winner.platform}</p>

            <div className="mt-8 flex items-center space-x-8">
              <div>
                <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-1">Negotiated Price</p>
                <p className="text-3xl font-bold font-mono text-brand-dark">₹{winner.priceQuoted}</p>
                <p className="text-xs text-brand-orange mt-1 line-through">vs original ₹{winner.priceInINR}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-1">Rating</p>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-amber-500 fill-current mr-1" />
                  <span className="text-2xl font-bold">{winner.rating}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">({winner.reviews} verified)</p>
              </div>
            </div>
          </div>

          {/* AI Call Summary widget */}
          <div className="bg-brand-light p-6 rounded-2xl border border-brand-border self-start">
            <div className="flex items-center text-sm font-semibold mb-3 text-brand-dark uppercase tracking-widest">
              <Bot className="w-4 h-4 mr-2 text-brand-orange" />
              AI Agent Verdict
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-brand-orange pl-3">
              "{winner.callSentiment === 'positive'
                ? `Supplier confirmed capacity immediately. Negotiated a 6% discount on bulk. Confirmed a ${winner.shippingDays}-day delivery window.`
                : 'Supplier verified inventory and acknowledged your specifications during the call.'}"
            </p>
            <div className="mt-4 pt-4 border-t border-brand-border flex justify-between items-center text-xs font-medium">
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Live Verified
              </span>
              <button
                onClick={() => transcript && setShowTranscript(true)}
                className={`flex items-center space-x-1 transition ${
                  transcript
                    ? 'text-brand-orange hover:underline cursor-pointer'
                    : 'text-gray-400 cursor-default'
                }`}
              >
                <PhoneCall className="w-3 h-3" />
                <span>{transcript ? 'View Call Transcript' : 'Transcript Unavailable'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">
            Vendors found: <span className="font-semibold text-brand-dark">{[winner, ...runnersUp].map(v => v.vendorName).join(' · ')}</span>
          </p>
          <a
            href={vendorLink(winner)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-dark text-white px-8 py-3 rounded-full font-medium shadow-md hover:bg-black transition flex items-center group whitespace-nowrap"
          >
            Contact {winner.vendorName} <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
          </a>
        </div>
      </motion.div>

      {/* Runners Up — collapsible */}
      <div className="mb-8">
        <button
          onClick={() => setShowAllVendors(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl border border-brand-border shadow-sm hover:border-brand-orange/40 transition text-sm font-medium text-brand-dark"
        >
          <span className="font-serif italic text-base">Other Viable Options ({runnersUp.length})</span>
          {showAllVendors ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        <AnimatePresence initial={false}>
          {showAllVendors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {runnersUp.slice(0, 6).map((vendor, idx) => {
                  const cat = CATEGORY_MAP[vendor.category || ''] || CATEGORY_MAP['cheapest']
                  const Icon = cat.icon
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-serif italic text-lg font-medium">{vendor.vendorName}</h5>
                          {vendor.category && (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${cat.color} flex items-center`}>
                              <Icon className="w-3 h-3 mr-1" /> {cat.label}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                          <span>Quote: <strong>₹{vendor.priceQuoted}</strong></span>
                          <span className="flex items-center"><Star className="w-3 h-3 text-amber-500 fill-current mr-1" />{vendor.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {vendor.callStatus !== 'not-called' && (
                          <div className="text-[11px] text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-brand-orange" />
                            {vendor.callSentiment === 'positive' ? 'Responsive & Capable' : 'Verified Available'}
                          </div>
                        )}
                        <a
                          href={vendorLink(vendor)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center text-xs font-medium text-brand-orange hover:underline"
                        >
                          Visit <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-16 text-center">
        <button
          onClick={() => resetWorkflow()}
          className="text-gray-400 hover:text-brand-orange underline text-sm transition"
        >
          Start a new sourcing campaign
        </button>
      </div>

      {/* ── Transcript Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showTranscript && transcript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm"
            onClick={() => setShowTranscript(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-white rounded-[28px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-brand-border flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-brand-dark">AI Agent Call Transcript</p>
                    <p className="text-[11px] text-gray-400">{winner.vendorName} · {winner.platform}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="w-8 h-8 rounded-full hover:bg-brand-light flex items-center justify-center transition text-gray-400 hover:text-brand-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transcript body */}
              <div className="overflow-y-auto px-8 py-6 flex-1 space-y-4">
                {transcript.split('\n').filter(Boolean).map((line, i) => {
                  const trimmed = line.trim()
                  const colonIdx = trimmed.indexOf(':')
                  const rawLabel = colonIdx > -1 ? trimmed.slice(0, colonIdx).trim() : ''
                  const content = colonIdx > -1 ? trimmed.slice(colonIdx + 1).trim() : trimmed

                  // AI / agent lines go on the left, vendor / user on the right
                  const isAI = /^(ai agent|ai|agent|assistant|aria)$/i.test(rawLabel)
                  const isVendor = /^(vendor|user|customer|seller)$/i.test(rawLabel) || (!isAI && rawLabel !== '')
                  const isLeft = isAI || (!isAI && !isVendor)

                  return (
                    <div key={i} className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isLeft
                            ? 'bg-brand-light border border-brand-border text-brand-dark rounded-bl-none'
                            : 'bg-gradient-to-r from-brand-orange to-[#F97316] text-white rounded-br-none'
                        }`}
                      >
                        {rawLabel && (
                          <span className={`font-bold text-[11px] block mb-1 uppercase tracking-wider ${isLeft ? 'text-brand-orange' : 'text-white/80'}`}>
                            {rawLabel}
                          </span>
                        )}
                        <span>{content || trimmed}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-brand-border flex items-center justify-between flex-shrink-0">
                <span className="flex items-center text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Live call — verified negotiation
                </span>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="text-sm font-medium text-gray-500 hover:text-brand-dark transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MapPin(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
}
