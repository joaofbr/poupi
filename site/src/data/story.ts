export type CategoryId =
  | 'alimentacao'
  | 'lazer'
  | 'saude'
  | 'mercado'
  | 'moradia'
  | 'contas'
  | 'transporte'
  | 'salario'

export type IconName =
  | 'utensils'
  | 'film'
  | 'heart'
  | 'cart'
  | 'home'
  | 'zap'
  | 'car'
  | 'wallet'

export type MemberId = 'marina' | 'lucas'

export interface Category {
  name: string
  color: string
  icon: IconName
}

export interface Member {
  name: string
  initials: string
  color: string
}

export interface Entry {
  id: string
  day: number
  launchedOn?: number
  title: string
  category: CategoryId
  amount: number
  members: MemberId[]
  card?: 'nubank'
  bill?: 'novembro' | 'dezembro'
}

export interface Slice {
  label: string
  color: string
  value: number
  percent: number
}

export const MONTH_LABEL = 'Novembro 2026'
export const NEXT_MONTH_LABEL = 'Dezembro 2026'
export const HERO_DAY = 16
export const CLOSE_DAY = 30
export const OTHER_COLOR = '#94a3a0'

export const CATEGORIES: Record<CategoryId, Category> = {
  alimentacao: { name: 'Alimentação', color: '#c98500', icon: 'utensils' },
  lazer: { name: 'Lazer', color: '#d55181', icon: 'film' },
  saude: { name: 'Saúde', color: '#e66767', icon: 'heart' },
  mercado: { name: 'Mercado', color: '#d95926', icon: 'cart' },
  moradia: { name: 'Moradia', color: '#3987e5', icon: 'home' },
  contas: { name: 'Contas & Serviços', color: '#008300', icon: 'zap' },
  transporte: { name: 'Transporte', color: '#199e70', icon: 'car' },
  salario: { name: 'Salário', color: '#008300', icon: 'wallet' },
}

export const MEMBERS: Record<MemberId, Member> = {
  marina: { name: 'Marina Costa', initials: 'MC', color: '#3987e5' },
  lucas: { name: 'Lucas Costa', initials: 'LC', color: '#d95926' },
}

export const CARD = { name: 'Nubank', closingDay: 5, dueDay: 12 }

export const ENTRIES: Entry[] = [
  { id: 'padaria', day: 1, title: 'Padaria', category: 'alimentacao', amount: -18.4, members: ['marina'] },
  { id: 'cinema', day: 2, title: 'Cinema', category: 'lazer', amount: -78, members: ['marina'], card: 'nubank', bill: 'novembro' },
  { id: 'farmacia', day: 3, title: 'Farmácia', category: 'saude', amount: -92.3, members: ['marina'], card: 'nubank', bill: 'novembro' },
  { id: 'mercado', day: 4, title: 'Mercado', category: 'mercado', amount: -216.2, members: ['marina'] },
  { id: 'salario', day: 5, title: 'Salário', category: 'salario', amount: 2800, members: ['marina'] },
  { id: 'salario-lucas', day: 5, launchedOn: 10, title: 'Salário', category: 'salario', amount: 3200, members: ['lucas'] },
  { id: 'aluguel', day: 10, title: 'Aluguel', category: 'moradia', amount: -1600, members: ['marina', 'lucas'] },
  { id: 'mercado-cartao', day: 12, title: 'Mercado', category: 'mercado', amount: -189.9, members: ['marina'], card: 'nubank', bill: 'dezembro' },
  { id: 'uber', day: 15, title: 'Uber', category: 'transporte', amount: -25, members: ['marina'], card: 'nubank', bill: 'dezembro' },
  { id: 'luz', day: 18, title: 'Conta de luz', category: 'contas', amount: -168.4, members: ['marina'] },
  { id: 'internet', day: 20, title: 'Internet', category: 'contas', amount: -99.9, members: ['lucas'] },
  { id: 'feira', day: 22, title: 'Feira', category: 'mercado', amount: -74.5, members: ['lucas'] },
  { id: 'gasolina', day: 27, title: 'Gasolina', category: 'transporte', amount: -150, members: ['lucas'] },
]

export interface CalendarEvent {
  text: string
  highlight?: string
}

export const CALENDAR_EVENTS: Record<number, CalendarEvent> = {
  1: { text: 'padaria' },
  2: { text: 'cinema' },
  3: { text: 'farmácia' },
  4: { text: 'mercado' },
  5: { text: 'salário', highlight: 'Nubank fecha' },
  10: { text: 'aluguel', highlight: 'Lucas entra' },
  12: { text: 'mercado no cartão' },
  15: { text: 'uber' },
  18: { text: 'luz' },
  20: { text: 'internet' },
  22: { text: 'feira' },
  27: { text: 'gasolina' },
  30: { text: '', highlight: 'o mês fecha' },
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function weekday(day: number): string {
  return WEEKDAYS[new Date(2026, 10, day).getDay()]
}

export const pad2 = (value: number) => String(value).padStart(2, '0')

const toCents = (value: number) => Math.round(value * 100)
const fromCents = (value: number) => value / 100

const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function brl(value: number): string {
  return `${value < -0.004 ? '−' : ''}R$ ${money.format(Math.abs(value))}`
}

export function signedBrl(value: number): string {
  return `${value < 0 ? '−' : '+'} ${brl(Math.abs(value))}`
}

export function dayLabel(day: number, month = 11): string {
  return `${pad2(day)}/${pad2(month)}`
}

export function entry(id: string): Entry {
  const found = ENTRIES.find((e) => e.id === id)
  if (!found) throw new Error(`Lançamento ${id} não existe`)
  return found
}

export function visibleOn(day: number, members?: MemberId[]): Entry[] {
  return ENTRIES.filter(
    (e) =>
      (e.launchedOn ?? e.day) <= day &&
      (!members || e.members.some((m) => members.includes(m))),
  )
}

export function inNovember(e: Entry): boolean {
  return e.bill !== 'dezembro'
}

export function shareOf(e: Entry, member: MemberId): number {
  const index = e.members.indexOf(member)
  if (index < 0) return 0
  const total = toCents(e.amount)
  const parts = e.members.length
  const each = Math.round(total / parts)
  return fromCents(index === parts - 1 ? total - each * (parts - 1) : each)
}

export function monthTotals(day: number, members?: MemberId[]) {
  const list = visibleOn(day, members).filter(inNovember)
  let income = 0
  let expense = 0
  for (const e of list) {
    const cents = toCents(e.amount)
    if (cents > 0) income += cents
    else expense -= cents
  }
  return { income: fromCents(income), expense: fromCents(expense), balance: fromCents(income - expense) }
}

export function billTotal(bill: 'novembro' | 'dezembro', day: number): number {
  return fromCents(
    visibleOn(day)
      .filter((e) => e.card === 'nubank' && e.bill === bill)
      .reduce((sum, e) => sum - toCents(e.amount), 0),
  )
}

function percents(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0)
  if (total === 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * 100)
  const floors = raw.map(Math.floor)
  let missing = 100 - floors.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (missing <= 0) break
    floors[i] += 1
    missing -= 1
  }
  return floors
}

export function byCategory(day: number): Slice[] {
  const sums = new Map<CategoryId, number>()
  for (const e of visibleOn(day).filter(inNovember)) {
    if (e.amount >= 0) continue
    sums.set(e.category, (sums.get(e.category) ?? 0) - toCents(e.amount))
  }
  const sorted = [...sums.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 5)
  const rest = sorted.slice(5).reduce((sum, [, v]) => sum + v, 0)
  const items = top.map(([id, v]) => ({ label: CATEGORIES[id].name, color: CATEGORIES[id].color, value: v }))
  if (rest > 0) items.push({ label: 'Outras', color: OTHER_COLOR, value: rest })
  const pct = percents(items.map((i) => i.value))
  return items.map((i, index) => ({ ...i, value: fromCents(i.value), percent: pct[index] }))
}

export function byMember(day: number) {
  const ids: MemberId[] = ['marina', 'lucas']
  const sums = ids.map((id) =>
    visibleOn(day)
      .filter(inNovember)
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum - toCents(shareOf(e, id)), 0),
  )
  const pct = percents(sums)
  const total = sums.reduce((a, b) => a + b, 0)
  return {
    total: fromCents(total),
    members: ids.map((id, i) => ({ id, ...MEMBERS[id], value: fromCents(sums[i]), percent: pct[i] })),
  }
}

export function rowMeta(e: Entry, month = 11): string {
  const parts = [CATEGORIES[e.category].name, dayLabel(e.day, month)]
  if (e.card) parts.push(CARD.name)
  return parts.join(' · ')
}
