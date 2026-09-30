import { useState } from 'react'
import type { ChatMessage, FinancialInput } from '@shared/finance'
import Landing from './pages/Landing'
import PlanForm from './pages/PlanForm'
import Dashboard, { type Tab } from './pages/Dashboard'
import AnalyzingScreen from './components/AnalyzingScreen'
import { ApiError, getFinancialAdvice, type AdviceResult } from './services/api'
import { demoInput, emptyInput } from './data/demo'

type Screen = 'landing' | 'form' | 'analyzing' | 'dashboard'

// Financial data lives only in React state for this session — nothing is persisted.
export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [input, setInput] = useState<FinancialInput>(emptyInput)
  const [advice, setAdvice] = useState<AdviceResult | null>(null)
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [chat, setChat] = useState<ChatMessage[]>([])

  const analyze = async (data: FinancialInput) => {
    setInput(data)
    setError(null)
    setScreen('analyzing')
    window.scrollTo({ top: 0 })
    const started = Date.now()
    try {
      const result = await getFinancialAdvice(data)
      // Keep the analysis screen visible briefly so the transition feels intentional.
      await new Promise((r) => setTimeout(r, Math.max(0, 1400 - (Date.now() - started))))
      setAdvice(result)
      setChat([])
      setTab('dashboard')
      setScreen('dashboard')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? { message: err.message, details: err.details }
          : { message: 'We couldn’t generate your plan right now. Please try again in a moment.', details: [] },
      )
      setScreen('form')
    }
  }

  const reset = () => {
    setInput(emptyInput())
    setAdvice(null)
    setChat([])
    setScreen('landing')
  }

  if (screen === 'landing')
    return (
      <Landing
        onStart={() => {
          setInput(emptyInput())
          setScreen('form')
        }}
        onDemo={() => analyze(demoInput())}
      />
    )
  if (screen === 'analyzing') return <AnalyzingScreen />
  if (screen === 'form' || !advice)
    return (
      <PlanForm
        initial={input}
        error={error}
        onSubmit={analyze}
        onBack={() => (advice ? setScreen('dashboard') : setScreen('landing'))}
        hasPlan={Boolean(advice)}
      />
    )
  return (
    <Dashboard
      input={input}
      advice={advice}
      tab={tab}
      onTab={setTab}
      chat={chat}
      onChat={setChat}
      onEdit={() => setScreen('form')}
      onReset={reset}
      onCurrency={(currency) => setInput((i) => ({ ...i, currency }))}
    />
  )
}
