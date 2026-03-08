'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSourcingStore } from '@/store/sourcingStore'
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Wallet,
  Upload,
  X,
  FileImage,
  Search,
  RefreshCcw,
  PhoneCall,
  BarChart2,
  Hash,
} from 'lucide-react'

export default function PreFlightSummary() {
  const { userRequirement, setWorkflowState, setWorkflowSteps, setUserRequirement } = useSourcingStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(userRequirement?.designFiles ?? [])
  const [editingBudget, setEditingBudget] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [budgetInput, setBudgetInput] = useState(userRequirement?.budget?.toString() || '')
  const [deadlineInput, setDeadlineInput] = useState(userRequirement?.deadline || '')

  if (!userRequirement) return null

  const commitBudget = () => {
    setEditingBudget(false)
    const n = parseFloat(budgetInput.replace(/[^0-9.]/g, ''))
    setUserRequirement({ ...userRequirement, budget: isNaN(n) ? undefined : n })
  }

  const commitDeadline = () => {
    setEditingDeadline(false)
    setUserRequirement({ ...userRequirement, deadline: deadlineInput.trim() || undefined })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const merged = [...uploadedFiles, ...newFiles].slice(0, 5)
    setUploadedFiles(merged)
    setUserRequirement({ ...userRequirement, designFiles: merged, customDesign: merged.length > 0 })
  }

  const removeFile = (idx: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx)
    setUploadedFiles(updated)
    setUserRequirement({ ...userRequirement, designFiles: updated, customDesign: updated.length > 0 })
  }

  const startAutomation = () => {
    setWorkflowSteps([
      { id: 'search-platforms', title: 'Searching Platforms', status: 'pending', description: 'Scanning 12 global B2B platforms for vendors...' },
      { id: 'currency-conversion', title: 'Normalising Prices', status: 'pending', description: 'Converting all currencies to INR in real-time...' },
      { id: 'ai-filtering', title: 'AI Quality Filter', status: 'pending', description: 'Scoring vendors on quality, reliability & value...' },
      { id: 'voice-calls', title: 'Live Vendor Calls', status: 'pending', description: 'AI agent negotiating bulk pricing with top vendors...' },
      { id: 'final-analysis', title: 'Recommendation Matrix', status: 'pending', description: 'Ranking vendors and preparing your decision brief...' },
    ])
    setWorkflowState('executing')
  }

  const STEPS = [
    { icon: Search, label: 'Scan 12 B2B platforms globally' },
    { icon: RefreshCcw, label: 'Convert all prices to INR live' },
    { icon: PhoneCall, label: 'AI agent calls top vendors' },
    { icon: BarChart2, label: 'Rank & deliver the best options' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-orange font-semibold mb-2">Sourcing Brief</p>
        <h2 className="text-4xl font-serif italic text-brand-dark tracking-tight">
          Confirm & Launch
        </h2>
        <p className="text-gray-400 text-sm mt-2">Review what I captured. Add a design file if you have one.</p>
      </motion.div>

      {/* Requirement Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-4"
      >
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-4">What you&apos;re sourcing</p>

        {/* Product description */}
        <div className="bg-brand-light rounded-xl px-5 py-4 mb-5 border border-brand-border">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1.5">Product</p>
          <p className="text-brand-dark text-[15px] font-medium leading-snug">
            {userRequirement.productDescription
              ? userRequirement.productDescription
              : <span className="text-gray-400 italic text-sm">No description captured — go back and re-enter your request.</span>
            }
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-brand-light rounded-xl px-3 py-3 border border-brand-border text-center">
            <Hash className="w-4 h-4 text-brand-orange mx-auto mb-1.5" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Quantity</p>
            <p className="text-xl font-bold text-brand-dark">
              {userRequirement.quantity.toLocaleString()}
            </p>
          </div>

          <div
            className="bg-brand-light rounded-xl px-3 py-3 border border-brand-border text-center cursor-pointer hover:border-brand-orange/50 transition group"
            onClick={() => { setEditingBudget(true); setBudgetInput(userRequirement.budget?.toString() || '') }}
            title="Click to edit budget"
          >
            <Wallet className="w-4 h-4 text-brand-orange mx-auto mb-1.5" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Budget</p>
            {editingBudget ? (
              <input
                autoFocus
                className="w-full text-center text-sm font-bold text-brand-dark bg-transparent border-b border-brand-orange outline-none mt-1"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={e => { if (e.key === 'Enter') commitBudget() }}
                placeholder="e.g. 50000"
              />
            ) : (
              <p className="text-xl font-bold text-brand-dark">
                {userRequirement.budget ? `₹${userRequirement.budget.toLocaleString()}` : <span className="text-gray-400 text-sm">Tap to add</span>}
              </p>
            )}
          </div>

          <div
            className="bg-brand-light rounded-xl px-3 py-3 border border-brand-border text-center cursor-pointer hover:border-brand-orange/50 transition group"
            onClick={() => { setEditingDeadline(true); setDeadlineInput(userRequirement.deadline || '') }}
            title="Click to edit deadline"
          >
            <CalendarDays className="w-4 h-4 text-brand-orange mx-auto mb-1.5" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Deadline</p>
            {editingDeadline ? (
              <input
                autoFocus
                className="w-full text-center text-sm font-bold text-brand-dark bg-transparent border-b border-brand-orange outline-none mt-1"
                value={deadlineInput}
                onChange={e => setDeadlineInput(e.target.value)}
                onBlur={commitDeadline}
                onKeyDown={e => { if (e.key === 'Enter') commitDeadline() }}
                placeholder="e.g. March 30"
              />
            ) : (
              <p className="text-[13px] font-bold text-brand-dark leading-tight mt-0.5">
                {userRequirement.deadline || <span className="text-gray-400 text-sm">Tap to add</span>}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Design File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-4"
      >
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Design Files</p>
        <p className="text-xs text-gray-400 mb-4">Optional — attach logos, mockups, or spec sheets. Our AI will share these with vendors during negotiation calls.</p>

        {uploadedFiles.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-[1.5px] border-dashed border-brand-border rounded-xl py-7 flex flex-col items-center justify-center text-gray-400 hover:border-brand-orange/60 hover:text-brand-orange transition-all group"
          >
            <Upload className="w-5 h-5 mb-2 group-hover:scale-110 transition" />
            <p className="text-sm font-medium">Drop files or click to upload</p>
            <p className="text-[11px] mt-0.5">PNG, JPG, PDF · max 10MB each · up to 5 files</p>
          </button>
        ) : (
          <div className="space-y-2">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-brand-light px-4 py-3 rounded-xl border border-brand-border">
                <div className="flex items-center space-x-3">
                  <FileImage className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-dark truncate max-w-[180px]">{f.name}</p>
                    <p className="text-[11px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 hover:text-red-400 text-gray-400 transition flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {uploadedFiles.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-brand-orange text-xs font-medium mt-2 hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> <span>Add another file</span>
              </button>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </motion.div>

      {/* What happens next */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-6"
      >
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-4">What happens next</p>
        <div className="grid grid-cols-2 gap-3">
          {STEPS.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-start space-x-3 bg-brand-light rounded-xl p-3 border border-brand-border">
              <div className="w-7 h-7 bg-brand-orange/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-brand-orange" />
              </div>
              <p className="text-[12px] text-gray-600 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="flex gap-3"
      >
        <button
          onClick={() => setWorkflowState('interview')}
          className="flex items-center space-x-2 px-5 py-3.5 rounded-xl border border-brand-border text-gray-500 hover:text-brand-dark hover:border-gray-300 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <motion.button
          onClick={startAutomation}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-gradient-to-r from-brand-orange to-[#F97316] text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 group text-[15px]"
        >
          <span>Launch Sourcing Agent</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
        </motion.button>
      </motion.div>
    </div>
  )
}
