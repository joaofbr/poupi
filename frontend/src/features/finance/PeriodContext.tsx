import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { formatPeriodLabel } from '@/lib/format'

interface PeriodContextValue {
  year: number
  month: number
  label: string
  goToPreviousMonth: () => void
  goToNextMonth: () => void
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [{ year, month }, setPeriod] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const shift = (delta: number) =>
    setPeriod((current) => {
      const target = new Date(current.year, current.month + delta, 1)
      return { year: target.getFullYear(), month: target.getMonth() }
    })

  const value: PeriodContextValue = {
    year,
    month,
    label: formatPeriodLabel(year, month),
    goToPreviousMonth: () => shift(-1),
    goToNextMonth: () => shift(1),
  }

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePeriod(): PeriodContextValue {
  const context = useContext(PeriodContext)
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider')
  }
  return context
}
