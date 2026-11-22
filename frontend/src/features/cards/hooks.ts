import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { todayIso } from '@/lib/format'
import { financeApi } from '@/features/finance/api'
import { groupTransactions } from '@/features/finance/transactionEntries'
import type { Transaction } from '@/features/finance/types'
import { cardsApi } from './api'
import { billCycle, billMonth } from './billing'
import type { BillCycle } from './billing'
import type { Card, CardInput } from './types'

export interface OpenBill {
  cycle: BillCycle
  total: number
  purchases: number
}

export function useOpenBills(cards: Card[]) {
  const today = todayIso()
  const cycles = new Map(cards.map((card) => [card.id, billCycle(card, billMonth(card, today))]))
  const months = [
    ...new Map(
      [...cycles.values()].map(({ month }) => [`${month.year}-${month.month}`, month]),
    ).values(),
  ]
  const queries = useQueries({
    queries: months.map((month) => ({
      queryKey: ['transactions', month.year, month.month],
      queryFn: (): Promise<Transaction[]> =>
        financeApi.getMonthlyTransactions(month.year, month.month),
    })),
  })

  const bills = new Map<string, OpenBill>()
  const ready = queries.every((query) => query.data)
  if (ready) {
    for (const card of cards) {
      const cycle = cycles.get(card.id)
      if (!cycle) continue
      const index = months.findIndex(
        (month) => month.year === cycle.month.year && month.month === cycle.month.month,
      )
      const charges = (queries[index].data ?? []).filter(
        (t) => t.type === 'expense' && t.cardId === card.id,
      )
      bills.set(card.id, {
        cycle,
        total: charges.reduce((sum, t) => sum + t.amount, 0),
        purchases: groupTransactions(charges).length,
      })
    }
  }

  return {
    bills,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetch: () => queries.forEach((query) => void query.refetch()),
  }
}

export function useCards() {
  return useQuery<Card[]>({
    queryKey: ['cards'],
    queryFn: () => cardsApi.getCards(),
  })
}

function useInvalidateCards() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['cards'] })
}

export function useSaveCard() {
  const invalidate = useInvalidateCards()
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CardInput }) =>
      id ? cardsApi.updateCard(id, input) : cardsApi.createCard(input),
    onSuccess: invalidate,
  })
}

export function useSetCardActive() {
  const invalidate = useInvalidateCards()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      cardsApi.setCardActive(id, active),
    onSuccess: invalidate,
  })
}

export function useAssignCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, transactionIds }: { cardId: string; transactionIds: string[] }) =>
      cardsApi.assignCard(cardId, transactionIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  })
}
