import { cardFinish } from '../palette'

interface CardFaceProps {
  name: string
  color: string
  owner?: string | null
  caption: string
  amount?: string
  detail?: string
}

export function CardFace({ name, color, owner, caption, amount, detail }: CardFaceProps) {
  return (
    <div
      className="relative flex aspect-[1.586] w-full flex-col overflow-hidden rounded-[20px] p-[18px] text-white shadow-[0_18px_34px_-20px_rgba(6,40,28,0.55)] ring-1 ring-black/5 dark:ring-white/10"
      style={{ background: cardFinish(color) }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[38%] -right-[18%] aspect-square w-[78%] rounded-full border-[18px] border-white/[0.07]"
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-[17px] font-extrabold tracking-tight">{name}</span>
        {owner && (
          <span className="flex-shrink-0 truncate rounded-full bg-black/20 px-2.5 py-1 text-[11.5px] font-semibold">
            {owner}
          </span>
        )}
      </div>
      <span
        aria-hidden
        className="relative mt-3 h-[26px] w-[36px] rounded-[6px] bg-[linear-gradient(135deg,#f3dc9a,#c9a24a)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]"
      >
        <span className="absolute inset-x-[7px] top-1/2 h-px -translate-y-1/2 bg-black/25" />
        <span className="absolute inset-y-[6px] left-1/2 w-px -translate-x-1/2 bg-black/25" />
      </span>
      <div className="relative mt-auto flex items-end justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold text-white">{caption}</span>
          {amount && (
            <span className="block whitespace-nowrap text-[24px] font-extrabold leading-tight tracking-tight">
              {amount}
            </span>
          )}
        </span>
        {detail && (
          <span className="flex-shrink-0 whitespace-nowrap text-right text-[12.5px] font-semibold text-white">
            {detail}
          </span>
        )}
      </div>
    </div>
  )
}
