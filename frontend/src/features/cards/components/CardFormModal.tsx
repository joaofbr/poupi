import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { Select } from '@/components/ui/Select'
import { defaultDateInPeriod } from '@/lib/format'
import type { Member } from '@/features/finance/types'
import { billDates, billLabel, billMonth } from '../billing'
import { CARD_COLORS } from '../palette'
import type { Card, CardInput } from '../types'
import { CardFace } from './CardFace'

interface CardFormModalProps {
  editing: Card | null
  members: Member[]
  showOwner: boolean
  defaultColor: string
  saving: boolean
  archiving: boolean
  onClose: () => void
  onSubmit: (input: CardInput) => void
  onArchive?: () => void
}

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1)

const FIELD_CLASS =
  'h-[46px] w-full rounded-xl border-[1.5px] border-border-strong bg-surface px-3.5 text-[14px] text-text outline-none transition-colors hover:border-text-3 focus:border-primary'

const LABEL_CLASS = 'mb-1.5 block text-[13px] font-semibold text-text-2'

export function CardFormModal({
  editing,
  members,
  showOwner,
  defaultColor,
  saving,
  archiving,
  onClose,
  onSubmit,
  onArchive,
}: CardFormModalProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [closingDay, setClosingDay] = useState(editing?.closingDay ?? 1)
  const [dueDay, setDueDay] = useState(editing?.dueDay ?? 10)
  const [ownerId, setOwnerId] = useState(editing?.ownerId ?? '')
  const [color, setColor] = useState(editing?.color || defaultColor)
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirmingArchive, setConfirmingArchive] = useState(false)

  const now = new Date()
  const today = defaultDateInPeriod(now.getFullYear(), now.getMonth())
  const rule = { closingDay, dueDay }
  const reference = billMonth(rule, today)
  const { due } = billDates(rule, reference)
  const owners = members.filter((member) => member.active || member.id === ownerId)

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Informe o nome do cartão.')
      return
    }
    onSubmit({ name: name.trim(), closingDay, dueDay, ownerId: ownerId || null, color })
  }

  const ownerName = showOwner
    ? (members.find((member) => member.id === ownerId)?.name ?? 'Da família')
    : null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-[18px]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-h-[94vh] w-full max-w-[430px] overflow-y-auto rounded-[22px] bg-surface shadow-card-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-[18px]">
            <h3 className="text-[17px] font-extrabold tracking-tight">
              {editing ? 'Editar cartão' : 'Novo cartão'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-text-2"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
  
          <div className="p-5">
            <div className="mx-auto mb-5 w-full max-w-[300px]" aria-hidden>
              <CardFace
                name={name.trim() || 'Nome do cartão'}
                color={color}
                owner={ownerName}
                caption={`Fecha dia ${closingDay} · vence dia ${dueDay}`}
              />
            </div>
  
            <label htmlFor="card-name" className={LABEL_CLASS}>
              Nome do cartão
            </label>
            <input
              id="card-name"
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="Ex: Nubank"
              className={FIELD_CLASS}
            />
            {nameError && (
              <div className="mt-1.5 text-[12px] font-semibold text-expense">{nameError}</div>
            )}
  
            <div className="mt-4">
              <span id="card-color" className={LABEL_CLASS}>
                Cor
              </span>
              <div className="grid max-w-[340px] grid-cols-8 gap-2" role="radiogroup" aria-labelledby="card-color">
                {CARD_COLORS.map((option) => {
                  const checked = color === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setColor(option.value)}
                      className="flex aspect-square w-full items-center justify-center rounded-[10px] border-2 text-white"
                      style={{
                        background: option.value,
                        borderColor: checked ? 'var(--text)' : 'transparent',
                        boxShadow: checked ? '0 0 0 2px var(--surface) inset' : 'none',
                      }}
                    >
                      {checked && <Icon name="check" size={16} />}
                    </button>
                  )
                })}
              </div>
            </div>
  
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="card-closing" className={LABEL_CLASS}>
                  Fecha no dia
                </label>
                <Select
                  id="card-closing"
                  value={closingDay}
                  onChange={(e) => setClosingDay(Number(e.target.value))}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="card-due" className={LABEL_CLASS}>
                  Vence no dia
                </label>
                <Select
                  id="card-due"
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
  
            {showOwner && (
              <div className="mt-4">
                <label htmlFor="card-owner" className={LABEL_CLASS}>
                  De quem é
                </label>
                <Select
                  id="card-owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                >
                  <option value="">Da família</option>
                  {owners.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
  
            <p className="mb-6 mt-4 rounded-xl bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed text-text-2">
              Uma compra feita hoje entra na fatura de{' '}
              <strong className="font-semibold text-text">{billLabel(reference)}</strong>, que
              vence em <strong className="font-semibold text-text">{due}</strong>.
            </p>
  
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-[13px] border border-border-strong py-[13px] text-[14.5px] font-semibold text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-primary py-[13px] text-[14.5px] font-bold text-primary-fg disabled:opacity-60"
              >
                {saving && (
                  <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-white/35 border-t-white" />
                )}
                Salvar
              </button>
            </div>
  
            {onArchive && (
              <button
                type="button"
                onClick={() => setConfirmingArchive(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[13px] py-2.5 text-[14px] font-semibold text-expense hover:bg-surface-2"
              >
                Arquivar cartão
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmingArchive && onArchive && (
        <ConfirmDialog
          title="Arquivar cartão"
          message={`O ${name.trim() || 'cartão'} sai da lista e não aparece mais para novas compras. Os lançamentos continuam onde estão, e você pode reativar quando quiser.`}
          confirmLabel="Arquivar"
          destructive
          busy={archiving}
          onConfirm={onArchive}
          onCancel={() => setConfirmingArchive(false)}
        />
      )}
    </>
  )
}
