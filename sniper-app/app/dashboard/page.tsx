'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSourcingStore } from '@/store/sourcingStore'
import ChatInterface from '@/components/ChatInterface'
import PreFlightSummary from '@/components/PreFlightSummary'
import AutomationFeed from '@/components/AutomationFeed'
import ResultsView from '@/components/ResultsView'
import { Globe, MapPin, Menu, X, Plus, MessageSquare } from 'lucide-react'

export default function Dashboard() {
  const { workflowState, conversations, resetWorkflow, loadConversation, activeConversationId, setSourcingMode } = useSourcingStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mode, setMode] = useState<'local' | 'global'>('global')
  const [isSwitching, setIsSwitching] = useState(false)

  const handleModeSwitch = (newMode: 'local' | 'global') => {
    if (newMode === mode) return
    setIsSwitching(true)
    setMode(newMode)
    setSourcingMode(newMode)
    setTimeout(() => setIsSwitching(false), 2200)
  }

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark flex overflow-hidden font-sans">
      
      {/* Sliding Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed w-[280px] h-full bg-brand-surface border-r border-brand-border z-50 p-6 flex flex-col shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-serif italic text-brand-orange font-medium">Sniper</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">AI Sourcing Agent</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-brand-light rounded-full transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* New Campaign Button */}
        <button
          onClick={() => resetWorkflow()}
          className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl border border-brand-orange/40 text-brand-orange text-sm font-medium hover:bg-brand-orange/5 transition mb-6"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Recent Campaigns</p>
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No campaigns yet.<br />Start a conversation above.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv, i) => {
                const isActive = conv.id === activeConversationId
                const hasResults = conv.vendorResults && conv.vendorResults.length > 0
                return (
                  <li
                    key={conv.id}
                    onClick={() => hasResults ? loadConversation(conv.id) : undefined}
                    className={`group text-sm p-3 rounded-xl transition-all ${
                      hasResults ? 'cursor-pointer' : 'cursor-default opacity-60'
                    } ${
                      isActive
                        ? 'bg-brand-orange/10 border border-brand-orange/20 text-brand-dark'
                        : 'text-gray-500 hover:text-brand-dark hover:bg-brand-light'
                    }`}
                  >
                    <p className="font-medium truncate text-[13px]">{conv.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{conv.preview}</p>
                    {hasResults && (
                      <p className="text-[10px] text-brand-orange mt-1 font-medium uppercase tracking-wider">
                        {conv.vendorResults!.length} vendors →
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Bottom mode indicator */}
        <div className="pt-4 border-t border-brand-border mt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">
            {mode === 'global' ? '🌍 Global Sourcing Active' : '🇮🇳 India Local Active'}
          </p>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex justify-center relative min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 280 : 0 }}
      >
        {/* Top Floating Toggle */}
        <div className="absolute top-12 left-0 right-0 px-8 flex items-center justify-between z-40">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white rounded-full shadow-sm border border-brand-border hover:bg-brand-light transition">
              <Menu className="w-5 h-5 text-brand-dark" />
            </button>
          )}
          
          {workflowState === 'interview' && (
            <div className="flex mx-auto absolute left-1/2 -translate-x-1/2">
              <div className="bg-white p-1 rounded-full flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-brand-border">
                <button 
                  onClick={() => handleModeSwitch('local')}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'local' ? 'bg-gradient-to-r from-brand-orange to-brand-peach text-white shadow-md' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Local (India)</span>
                </button>
                <button 
                  onClick={() => handleModeSwitch('global')}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${mode === 'global' ? 'bg-gradient-to-r from-brand-orange to-brand-peach text-white shadow-md' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Global Sourcing</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global / Local Mode Animations */}
        <AnimatePresence>
          {isSwitching && mode === 'local' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-light/90 backdrop-blur-md pointer-events-none overflow-hidden"
            >
              {/* radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(242,96,45,0.07),transparent)]" />

              <motion.p
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-3xl font-serif italic text-brand-orange tracking-wider mb-12 z-10"
              >
                Discovering Bharat
              </motion.p>

              {/* Two rows of Indian monuments — emoji only, no labels */}
              <div className="flex flex-col items-center gap-5 z-10">
                <div className="flex items-center justify-center gap-8">
                  {[
                    { emoji: '🕌', delay: 0.05 },
                    { emoji: '🏛️', delay: 0.15 },
                    { emoji: '🛕', delay: 0.25 },
                    { emoji: '🏯', delay: 0.35 },
                  ].map(({ emoji, delay }, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 70, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 130, damping: 13 }}
                      className="text-[72px] leading-none select-none"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-8">
                  {[
                    { emoji: '🪷', delay: 0.20 },
                    { emoji: '🌉', delay: 0.30 },
                    { emoji: '🏔️', delay: 0.40 },
                  ].map(({ emoji, delay }, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 70, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 130, damping: 13 }}
                      className="text-[72px] leading-none select-none"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="text-xs text-gray-400 mt-8 tracking-widest uppercase z-10"
              >
                IndiaMart · TradeIndia · ExportersIndia · Udaan · JustDial B2B
              </motion.p>
            </motion.div>
          )}

          {isSwitching && mode === 'global' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-light/90 backdrop-blur-md pointer-events-none overflow-hidden"
            >
              {/* radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(242,96,45,0.07),transparent)]" />

              <motion.p
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-3xl font-serif italic text-brand-orange tracking-wider mb-12 z-10"
              >
                Going Global
              </motion.p>

              {/* Two rows of landmarks — emoji only, no labels */}
              <div className="flex flex-col items-center gap-5 z-10">
                <div className="flex items-center justify-center gap-8">
                  {[
                    { emoji: '🗼', delay: 0.05 },
                    { emoji: '🗽', delay: 0.15 },
                    { emoji: '🏯', delay: 0.25 },
                    { emoji: '🕌', delay: 0.35 },
                  ].map(({ emoji, delay }, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 70, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 130, damping: 13 }}
                      className="text-[72px] leading-none select-none"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-8">
                  {[
                    { emoji: '🎡', delay: 0.20 },
                    { emoji: '🌉', delay: 0.30 },
                    { emoji: '🏰', delay: 0.40 },
                  ].map(({ emoji, delay }, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 70, opacity: 0, scale: 0.7 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 130, damping: 13 }}
                      className="text-[72px] leading-none select-none"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="text-xs text-gray-400 mt-8 tracking-widest uppercase z-10"
              >
                Alibaba · GlobalSources · DHgate · TradeKey · SEA Sourcing
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Render */}
        <div className="w-full max-w-4xl px-8 pt-40 pb-12 relative z-10 flex flex-col justify-center min-h-screen">
          <AnimatePresence mode="wait">
            {workflowState === 'interview' && (
              <motion.div key="interview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ChatInterface />
              </motion.div>
            )}

            {workflowState === 'pre-flight' && (
              <motion.div key="preflight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PreFlightSummary />
              </motion.div>
            )}

            {workflowState === 'executing' && (
              <motion.div key="executing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AutomationFeed />
              </motion.div>
            )}

            {workflowState === 'completed' && (
              <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResultsView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
