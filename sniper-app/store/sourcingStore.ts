import { create } from 'zustand'

export type WorkflowStep = {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  description?: string
  timestamp?: string
}

export type VendorResult = {
  id: string
  platform: string
  vendorName: string
  price: number
  currency: string
  priceInINR: number
  priceQuoted: number
  rating: number
  reviews: number
  shippingDays: number
  location: string
  phoneNumber: string
  email: string
  productUrl: string
  customCapable: boolean
  moq: number
  category: 'cheapest' | 'best-reviewed' | 'fastest' | 'best-service' | null
  callStatus: 'not-called' | 'completed' | 'failed' | 'no-answer'
  callSentiment: 'positive' | 'neutral' | 'negative' | null
  transcript?: string | null
}

export type UserRequirement = {
  productDescription: string
  quantity: number
  customDesign: boolean
  designFiles: File[]
  budget?: number
  deadline?: string
  additionalNotes?: string
}

export type ConversationEntry = {
  id: string
  title: string
  preview: string
  createdAt: string
  // Persisted results so clicking the sidebar restores the full view
  vendorResults?: VendorResult[]
  productDescription?: string
  quantity?: number
  budget?: number
  deadline?: string
}

type WorkflowState = 'idle' | 'interview' | 'pre-flight' | 'executing' | 'completed'

const CONVERSATIONS_KEY = 'sniper_conversations'

function loadConversations(): ConversationEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]')
  } catch { return [] }
}

function persistConversations(convs: ConversationEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs))
}

interface SourcingStore {
  workflowState: WorkflowState
  userRequirement: UserRequirement | null
  workflowSteps: WorkflowStep[]
  vendors: VendorResult[]
  vendorResults: VendorResult[]
  selectedVendor: VendorResult | null
  conversations: ConversationEntry[]
  activeConversationId: string | null
  currentMessages: Array<{role: string; content: string}>
  callTranscript: string | null
  sourcingMode: 'local' | 'global'

  // Actions
  setWorkflowState: (state: WorkflowState) => void
  setSourcingMode: (mode: 'local' | 'global') => void
  setUserRequirement: (req: UserRequirement) => void
  addWorkflowStep: (step: WorkflowStep) => void
  setWorkflowSteps: (steps: WorkflowStep[]) => void
  updateWorkflowStep: (id: string, updates: Partial<WorkflowStep>) => void
  addVendor: (vendor: VendorResult) => void
  setVendorResults: (vendors: VendorResult[]) => void
  setSelectedVendor: (vendor: VendorResult) => void
  setCurrentMessages: (messages: Array<{role: string; content: string}>) => void
  setCallTranscript: (transcript: string | null) => void
  saveConversation: (finalResults: VendorResult[]) => void
  loadConversation: (id: string) => void
  resetWorkflow: () => void
}

export const useSourcingStore = create<SourcingStore>((set, get) => ({
  workflowState: 'interview',
  userRequirement: null,
  workflowSteps: [],
  vendors: [],
  vendorResults: [],
  selectedVendor: null,
  conversations: loadConversations(),
  activeConversationId: null,
  currentMessages: [],
  callTranscript: null,
  sourcingMode: 'global',

  setSourcingMode: (mode) => set({ sourcingMode: mode }),

  setWorkflowState: (state) => set({ workflowState: state }),

  setUserRequirement: (req) => set({ userRequirement: req }),

  setCurrentMessages: (messages) => set({ currentMessages: messages }),

  addWorkflowStep: (step) =>
    set((state) => ({
      workflowSteps: [...state.workflowSteps, step],
    })),

  setWorkflowSteps: (steps) => set({ workflowSteps: steps }),

  updateWorkflowStep: (id, updates) =>
    set((state) => ({
      workflowSteps: state.workflowSteps.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      ),
    })),

  addVendor: (vendor) =>
    set((state) => ({ vendors: [...state.vendors, vendor] })),

  setVendorResults: (vendors) =>
    set({ vendors, vendorResults: vendors }),

  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),

  setCallTranscript: (transcript) => set({ callTranscript: transcript }),

  // Called from AutomationFeed after workflow completes — saves full results so
  // the sidebar can restore this result view at any time.
  saveConversation: (finalResults) => {
    const { userRequirement, currentMessages } = get()
    const title = userRequirement?.productDescription?.split(' — ')[0] || 'Sourcing Request'
    const preview =
      currentMessages.find((m) => m.role === 'user')?.content?.slice(0, 60) || title

    const entry: ConversationEntry = {
      id: Date.now().toString(),
      title: title.slice(0, 40),
      preview,
      createdAt: new Date().toISOString(),
      vendorResults: finalResults,
      productDescription: userRequirement?.productDescription,
      quantity: userRequirement?.quantity,
      budget: userRequirement?.budget,
      deadline: userRequirement?.deadline,
    }

    const updated = [entry, ...get().conversations.filter(c => c.title !== entry.title)].slice(0, 20)
    persistConversations(updated)
    set({ conversations: updated, activeConversationId: entry.id })
  },

  // Restore a previous campaign's results when the user clicks a sidebar entry.
  loadConversation: (id) => {
    const entry = get().conversations.find((c) => c.id === id)
    if (!entry || !entry.vendorResults || entry.vendorResults.length === 0) return
    set({
      vendorResults: entry.vendorResults,
      vendors: entry.vendorResults,
      workflowState: 'completed',
      activeConversationId: id,
      workflowSteps: [],
      userRequirement: entry.productDescription
        ? {
            productDescription: entry.productDescription,
            quantity: entry.quantity ?? 100,
            customDesign: false,
            designFiles: [],
            budget: entry.budget,
            deadline: entry.deadline,
          }
        : null,
    })
  },

  resetWorkflow: () =>
    set({
      workflowState: 'interview',
      userRequirement: null,
      workflowSteps: [],
      vendors: [],
      vendorResults: [],
      selectedVendor: null,
      activeConversationId: null,
      currentMessages: [],
      callTranscript: null,
      // keep sourcingMode — user may have toggled it before starting
    }),
}))
