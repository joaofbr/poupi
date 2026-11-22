import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastProvider'
import { getApiErrorMessage } from '@/lib/apiError'
import { useHasFamily, useMembers } from '@/features/finance/hooks'
import { CardCarousel } from '../components/CardCarousel'
import { CardDetails } from '../components/CardDetails'
import { CardFormModal } from '../components/CardFormModal'
import { useCards, useOpenBills, useSaveCard, useSetCardActive } from '../hooks'
import { cardFinish, nextCardColor } from '../palette'
import type { Card, CardInput } from '../types'

export function CardsPage() {
  const { showToast } = useToast()
  const cardsQuery = useCards()
  const members = useMembers().data ?? []
  const hasFamily = useHasFamily()
  const saveCard = useSaveCard()
  const setActive = useSetCardActive()
  const [modal, setModal] = useState<{ editing: Card | null } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cards = cardsQuery.data ?? []
  const activeCards = cards.filter((card) => card.active)
  const archivedCards = cards.filter((card) => !card.active)
  const openBills = useOpenBills(activeCards)
  const selected = activeCards.find((card) => card.id === selectedId) ?? activeCards[0]

  const ownerOf = (card: Card) =>
    hasFamily ? (members.find((member) => member.id === card.ownerId)?.name ?? 'Da família') : null

  const showError = (fallback: string) => (error: unknown) =>
    showToast(getApiErrorMessage(error, fallback), 'warning')

  const handleSubmit = (input: CardInput) => {
    const editing = modal?.editing ?? null
    saveCard.mutate(
      { id: editing?.id ?? null, input },
      {
        onSuccess: (saved) => {
          setModal(null)
          if (!editing) setSelectedId(saved.id)
          showToast(editing ? 'Cartão atualizado' : 'Cartão cadastrado')
        },
        onError: showError('Não foi possível salvar o cartão'),
      },
    )
  }

  const handleActive = (card: Card, active: boolean) =>
    setActive.mutate(
      { id: card.id, active },
      {
        onSuccess: () => {
          setModal(null)
          if (active) setSelectedId(card.id)
          showToast(active ? 'Cartão reativado' : 'Cartão arquivado', 'neutral')
        },
        onError: showError('Não foi possível alterar o cartão'),
      },
    )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13.5px] text-text-2">
          Cada compra no cartão conta no mês em que a fatura vence.
        </p>
        <Button
          type="button"
          className="flex-shrink-0"
          data-tour="new-card"
          onClick={() => setModal({ editing: null })}
        >
          <Icon name="plus" size={18} />
          Novo
        </Button>
      </div>

      {cardsQuery.isError ? (
        <div className="rounded-2xl border border-border bg-surface shadow-card">
          <QueryError onRetry={() => void cardsQuery.refetch()} />
        </div>
      ) : cardsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="w-[min(340px,100%)]">
            <Skeleton height={212} />
          </div>
          <Skeleton height={220} />
        </div>
      ) : activeCards.length === 0 ? (
        <EmptyCards hasArchived={archivedCards.length > 0} />
      ) : (
        selected && (
          <div className="grid grid-cols-1 gap-4">
            <CardCarousel
              cards={activeCards}
              bills={openBills.bills}
              ownerOf={ownerOf}
              selectedId={selected.id}
              onSelect={setSelectedId}
            />
            <CardDetails
              card={selected}
              bill={openBills.bills.get(selected.id)}
              owner={ownerOf(selected)}
              loading={openBills.isLoading}
              failed={openBills.isError}
              onRetry={openBills.refetch}
              onEdit={() => setModal({ editing: selected })}
            />
          </div>
        )
      )}

      {archivedCards.length > 0 && (
        <ArchivedCards
          cards={archivedCards}
          busy={setActive.isPending}
          onReactivate={(card) => handleActive(card, true)}
        />
      )}

      {modal && (
        <CardFormModal
          editing={modal.editing}
          members={members}
          showOwner={hasFamily}
          defaultColor={nextCardColor(cards.length)}
          saving={saveCard.isPending}
          archiving={setActive.isPending}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          onArchive={modal.editing?.active ? () => handleActive(modal.editing as Card, false) : undefined}
        />
      )}
    </div>
  )
}

function EmptyCards({ hasArchived }: { hasArchived: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-card">
      <div
        aria-hidden
        className="mx-auto mb-5 flex aspect-[1.586] w-[180px] flex-col justify-end rounded-[16px] border-2 border-dashed border-border-strong p-3"
      >
        <span className="h-2 w-16 rounded-full bg-surface-2" />
        <span className="mt-1.5 h-3 w-24 rounded-full bg-surface-2" />
      </div>
      <div className="mb-1.5 text-[16px] font-bold">
        {hasArchived ? 'Nenhum cartão ativo' : 'Nenhum cartão cadastrado'}
      </div>
      <p className="mx-auto max-w-[340px] text-[14px] text-text-2">
        Cadastre o cartão com o dia de fechamento e de vencimento. Depois é só lançar a
        compra com a data real: ela aparece no mês da fatura.
      </p>
    </div>
  )
}

interface ArchivedCardsProps {
  cards: Card[]
  busy: boolean
  onReactivate: (card: Card) => void
}

function ArchivedCards({ cards, busy, onReactivate }: ArchivedCardsProps) {
  return (
    <section className="mt-6" aria-labelledby="archived-cards">
      <h2 id="archived-cards" className="mb-2 text-[13px] font-semibold text-text-2">
        Arquivados
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {cards.map((card) => (
          <div
            key={card.id}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <span
              aria-hidden
              className="h-[26px] w-[40px] flex-shrink-0 rounded-[6px] opacity-60"
              style={{ background: cardFinish(card.color) }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-semibold">{card.name}</span>
              <span className="block truncate text-[12.5px] text-text-3">
                Fecha dia {card.closingDay} · vence dia {card.dueDay}
              </span>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onReactivate(card)}
              className="flex-shrink-0 whitespace-nowrap rounded-[10px] border border-border-strong px-3 py-2 text-[12.5px] font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-60"
            >
              Reativar
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
