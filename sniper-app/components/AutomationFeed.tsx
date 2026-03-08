'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSourcingStore } from '@/store/sourcingStore'
import { WorkflowOrchestrator } from '@/lib/workflowOrchestrator'
import {
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  Brain,
  Phone,
  BarChart3,
  Loader2,
} from 'lucide-react'

const iconMap: Record<string, any> = {
  'search-platforms': Search,
  'currency-conversion': DollarSign,
  'ai-filtering': Brain,
  'voice-calls': Phone,
  'final-analysis': BarChart3,
}

const stepColors: Record<string, string> = {
  'search-platforms': 'bg-blue-50 text-blue-500 border-blue-100',
  'currency-conversion': 'bg-emerald-50 text-emerald-500 border-emerald-100',
  'ai-filtering': 'bg-violet-50 text-violet-500 border-violet-100',
  'voice-calls': 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
  'final-analysis': 'bg-amber-50 text-amber-500 border-amber-100',
}

export default function AutomationFeed() {
  const {
    workflowSteps,
    updateWorkflowStep,
    setWorkflowState,
    userRequirement,
    setVendorResults,
    saveConversation,
    setCallTranscript,
    sourcingMode,
  } = useSourcingStore()

  const [currentSubTasks, setCurrentSubTasks] = useState<string[]>([])
  const activeStepIdRef = useRef<string | null>(null)
  // Guard against React StrictMode double-invoking the effect (would fire 2 real Bland AI calls)
  const hasStartedRef = useRef(false)
  const [stats, setStats] = useState({ platformsScanned: 0, vendorsFound: 0, callsMade: 0 })

  useEffect(() => {
    if (hasStartedRef.current) return
    if (workflowSteps.length === 0 || workflowSteps[0].status !== 'pending') return
    hasStartedRef.current = true

    const executeWorkflow = async () => {
      const orchestrator = new WorkflowOrchestrator(
        userRequirement,
        (stepId, status, message) => {
          const validStatus = status as 'pending' | 'in-progress' | 'completed' | 'error'
          updateWorkflowStep(stepId, {
            status: validStatus,
            timestamp: new Date().toISOString(),
          })
          if (status === 'in-progress') {
            if (stepId !== activeStepIdRef.current) {
              activeStepIdRef.current = stepId
              setCurrentSubTasks(message ? [message] : [])
            } else if (message) {
              setCurrentSubTasks((prev) => [...prev, message])
            }
          }
          const context = orchestrator?.context
          if (context) {
            setStats({
              platformsScanned: context.vendors?.length > 0 ? 12 : 0,
              vendorsFound: context.vendors?.length || 0,
              callsMade: context.callResults?.length || 0,
            })
          }
        },
        sourcingMode
      )
      try {
        const result = await orchestrator.execute()
        if (result.success && result.finalResults) {
          setVendorResults(result.finalResults)
          // Save real transcript if we got one
          if (orchestrator.context.callTranscript) {
            setCallTranscript(orchestrator.context.callTranscript)
          }
          saveConversation(result.finalResults)
          setTimeout(() => setWorkflowState('completed'), 1200)
        } else {
          const currentStep = workflowSteps.find(s => s.status === 'in-progress')
          if (currentStep) {
            updateWorkflowStep(currentStep.id, { status: 'error', timestamp: new Date().toISOString() })
          }
        }
      } catch (err) {
        console.error('Workflow error', err)
      }
    }

    executeWorkflow()
  }, [])

  const activeStep = workflowSteps.find(s => s.status === 'in-progress')
  const isOnCall = activeStep?.id === 'voice-calls'
  const completedCount = workflowSteps.filter(s => s.status === 'completed').length

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-orange font-semibold mb-2">
          Autonomous Sourcing
        </p>
        <h2 className="text-4xl font-serif italic text-brand-dark tracking-tight">
          {isOnCall ? 'AI Agent is on a call...' : 'Working on it.'}
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          {isOnCall
            ? 'Do not leave this page. Your AI is negotiating with vendors right now.'
            : 'Searching, filtering, and negotiating on your behalf.'}
        </p>
      </motion.div>

      {/* Live Call Banner — persistent during voice-calls step */}
      <AnimatePresence>
        {isOnCall && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-brand-dark text-white rounded-2xl px-6 py-5 mb-6 relative overflow-hidden"
          >
            {/* Pulse background */}
            <motion.div
              className="absolute inset-0 bg-brand-orange/10"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-brand-orange rounded-full"
                      animate={{ height: ['6px', `${8 + Math.random() * 24}px`, '6px'] }}
                      transition={{
                        duration: 0.6 + Math.random() * 0.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.06,
                      }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Live Negotiation Call</p>
                  <p className="text-xs text-gray-400 mt-0.5">AI agent is speaking with vendors</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-2 h-2 bg-brand-orange rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="text-xs text-brand-peach font-medium uppercase tracking-wider">On Call</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Overall Progress</p>
          <p className="text-xs font-bold text-brand-dark font-mono">
            {completedCount}/{workflowSteps.length} steps
          </p>
        </div>
        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-orange to-brand-peach rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${workflowSteps.length > 0 ? (completedCount / workflowSteps.length) * 100 : 0}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {workflowSteps.map((step, index) => {
          const Icon = iconMap[step.id] || Loader2
          const isActive = step.status === 'in-progress'
          const isCompleted = step.status === 'completed'
          const isError = step.status === 'error'
          const isPending = step.status === 'pending'
          const colorClass = stepColors[step.id] || 'bg-gray-50 text-gray-400 border-gray-100'

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: isPending ? 0.45 : 1, x: 0 }}
              transition={{ delay: index * 0.07, duration: 0.4 }}
              className={`bg-white rounded-2xl border p-5 transition-all duration-500 ${
                isActive
                  ? 'border-brand-orange/40 shadow-[0_2px_20px_rgba(241,90,43,0.08)]'
                  : isCompleted
                  ? 'border-brand-border'
                  : isError
                  ? 'border-red-200'
                  : 'border-brand-border'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isActive ? colorClass : isCompleted ? 'bg-green-50 text-green-500 border-green-100' : isError ? 'bg-red-50 text-red-400 border-red-100' : 'bg-gray-50 text-gray-300 border-gray-100'
                  }`}
                >
                  {isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-[14px] font-semibold ${isActive ? 'text-brand-dark' : isCompleted ? 'text-gray-600' : isError ? 'text-red-500' : 'text-gray-400'}`}
                      style={{ fontStyle: 'normal', fontFamily: 'Inter, sans-serif' }}
                    >
                      {step.title}
                    </p>
                    {step.timestamp && isCompleted && (
                      <span className="text-[11px] text-gray-400 font-mono flex-shrink-0 ml-2">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                    {step.description}
                  </p>

                  {/* Progress bar for active non-call steps */}
                  {isActive && step.id !== 'voice-calls' && (
                    <div className="relative h-0.5 bg-brand-border rounded-full overflow-hidden mt-3">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 6, ease: 'linear' }}
                        className="absolute inset-y-0 left-0 bg-brand-orange rounded-full"
                      />
                    </div>
                  )}

                  {/* Sub-tasks */}
                  {isActive && currentSubTasks.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {currentSubTasks.slice(-2).map((task, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-2"
                        >
                          <div className="w-1 h-1 bg-brand-orange/60 rounded-full flex-shrink-0" />
                          <span className="text-[11px] text-gray-500">{task}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Live Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'Platforms', value: stats.platformsScanned },
          { label: 'Vendors', value: stats.vendorsFound },
          { label: 'Calls Made', value: stats.callsMade },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-brand-border rounded-xl p-4 text-center"
          >
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
            <motion.p
              key={s.value}
              initial={{ scale: 1.2, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-brand-dark font-mono"
            >
              {s.value}
            </motion.p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

