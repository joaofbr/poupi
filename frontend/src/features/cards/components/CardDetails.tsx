import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { QueryError } from '@/components/ui/QueryError'
import { Skeleton } from '@/components/ui/Skeleton'
import { daysFromToday, formatDateShort, formatMoney, plural } from '@/lib/format'
import { billShortLabel, closesInLabel } from '../billing'
import type { OpenBill } from '../hooks'
import type { Card } from '../types'

interface CardDetailsProps {
  card: Card
  bill: OpenBill | undefined
  owner: string | null
  loading: boolean
  failed: boolean
  onRetry: () => void
  onEdit: () => void
}

export function CardDetails({ card, bill, owner, loading, failed, onRetry, onEdit }: CardDetailsProps) {
  return (
    <section
      aria-label={`Fatura aberta do ${card.name}`}
      className="rounded-2xl border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-text-2">
            {bill ? `Fatura de ${billShortLabel(bill.cycle.month)} · aberta` : 'Fatura aberta'}
          </div>
          {bill ? (
            <>
              <div className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight">
                {formatMoney(bill.total)}
              </div>
              <div className="text-[13px] text-text-3">
                {bill.purchases === 0
                  ? 'Nenhuma compra até agora'
                  : `${plural(bill.purchases, 'compra', 'compras')} até agora`}
              </div>
            </>
          ) : loading ? (
            <div className="mt-2 w-40">
              <Skeleton height={34} />
            </div>
          ) : null}
        </div>
        <Button type="button" variant="secondary" className="flex-shrink-0" onClick={onEdit}>
          <Icon name="pencil" size={16} />
          Editar
        </Button>
      </div>

      {failed ? (
        <div className="mt-4 rounded-xl border border-border">
          <QueryError onRetry={onRetry} />
        </div>
      ) : bill ? (
        <CycleDetails card={card} bill={bill} owner={owner} />
      ) : null}
    </section>
  )
}

function CycleDetails({ card, bill, owner }: { card: Card; bill: OpenBill; owner: string | null }) {
  const { cycle } = bill
  const total = Math.max(1, daysFromToday(cycle.closesOn) - daysFromToday(cycle.opensOn))
  const elapsed = Math.min(total, Math.max(0, -daysFromToday(cycle.opensOn)))
  const progress = Math.round((elapsed / total) * 100)
  const closesIn = daysFromToday(cycle.closesOn)
  const [year, month, day] = cycle.closesOn.split('-').map(Number)
  const lastDay = new Date(year, month - 1, day - 1)
  const lastDayLabel = `${String(lastDay.getDate()).padStart(2, '0')}/${String(lastDay.getMonth() + 1).padStart(2, '0')}`

  return (
    <>
      <div className="mt-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label="Ciclo da fatura"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: card.color }} />
        </div>
        <div className="mt-2 flex justify-between gap-3 text-[12.5px] text-text-3">
          <span>Abriu {formatDateShort(cycle.opensOn)}</span>
          <span className="font-semibold text-text-2">{closesInLabel(closesIn)}</span>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div>
          <dt className="text-[12.5px] text-text-3">Fecha</dt>
          <dd className="text-[14.5px] font-semibold">{formatDateShort(cycle.closesOn)}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-text-3">Vence</dt>
          <dd className="text-[14.5px] font-semibold">{formatDateShort(cycle.dueOn)}</dd>
        </div>
        {owner && (
          <div>
            <dt className="text-[12.5px] text-text-3">De quem é</dt>
            <dd className="truncate text-[14.5px] font-semibold">{owner}</dd>
          </div>
        )}
      </dl>

      <p className="mt-5 rounded-xl bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed text-text-2">
        Compras até <strong className="font-semibold text-text">{lastDayLabel}</strong> entram nesta
        fatura. A partir de{' '}
        <strong className="font-semibold text-text">{formatDateShort(cycle.closesOn)}</strong>, vão
        para a de {billShortLabel(cycle.next)}.
      </p>
    </>
  )
}
