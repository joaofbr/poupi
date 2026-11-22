import { useRef } from 'react'
import { daysFromToday, formatMoney } from '@/lib/format'
import { billShortLabel, closesInLabel } from '../billing'
import type { OpenBill } from '../hooks'
import type { Card } from '../types'
import { CardFace } from './CardFace'

interface CardCarouselProps {
  cards: Card[]
  bills: Map<string, OpenBill>
  ownerOf: (card: Card) => string | null
  selectedId: string
  onSelect: (id: string) => void
}

export function CardCarousel({ cards, bills, ownerOf, selectedId, onSelect }: CardCarouselProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  const handleScroll = () => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const element = scroller.current
      if (!element || element.scrollWidth <= element.clientWidth) return
      const center = element.scrollLeft + element.clientWidth / 2
      const items = [...element.children] as HTMLElement[]
      let closest = 0
      items.forEach((item, index) => {
        const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - center)
        const best = Math.abs(items[closest].offsetLeft + items[closest].offsetWidth / 2 - center)
        if (distance < best) closest = index
      })
      const id = cards[closest]?.id
      if (id && id !== selectedId) onSelect(id)
    })
  }

  const select = (index: number) => {
    onSelect(cards[index].id)
    const item = scroller.current?.children[index] as HTMLElement | undefined
    const element = scroller.current
    if (!item || !element || element.scrollWidth <= element.clientWidth) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollTo({
      left: item.offsetLeft - (element.clientWidth - item.offsetWidth) / 2,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  return (
    <div>
      <div
        ref={scroller}
        onScroll={handleScroll}
        className="relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => {
          const bill = bills.get(card.id)
          const selected = card.id === selectedId
          return (
            <div key={card.id} className="w-[min(340px,calc(100vw-64px))] flex-shrink-0 snap-center lg:w-[calc((100%-24px)/3)] lg:max-w-[340px]">
              <button
                type="button"
                onClick={() => select(index)}
                aria-pressed={selected}
                aria-label={`${card.name}${bill ? `, fatura de ${billShortLabel(bill.cycle.month)} com ${formatMoney(bill.total)}` : ''}`}
                className={`block w-full rounded-[20px] text-left transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
                  selected ? 'opacity-100' : 'scale-[0.96] opacity-60 hover:opacity-85'
                }`}
              >
                <CardFace
                  name={card.name}
                  color={card.color}
                  owner={ownerOf(card)}
                  caption={bill ? `Fatura de ${billShortLabel(bill.cycle.month)}` : 'Fatura aberta'}
                  amount={bill ? formatMoney(bill.total) : '—'}
                  detail={bill ? closesInLabel(daysFromToday(bill.cycle.closesOn)) : undefined}
                />
              </button>
            </div>
          )
        })}
      </div>

      {cards.length > 1 && (
        <div className="mt-1 flex justify-center gap-1.5" role="group" aria-label="Escolher cartão">
          {cards.map((card, index) => {
            const selected = card.id === selectedId
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => select(index)}
                aria-label={`Mostrar ${card.name}`}
                aria-current={selected}
                className="flex h-6 items-center justify-center px-1"
              >
                <span
                  className={`block h-[7px] rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    selected ? 'w-5' : 'w-[7px] bg-border-strong'
                  }`}
                  style={selected ? { background: card.color } : undefined}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
