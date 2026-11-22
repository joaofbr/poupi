export interface Card {
  id: string
  name: string
  closingDay: number
  dueDay: number
  ownerId: string | null
  color: string
  active: boolean
}

export interface CardInput {
  name: string
  closingDay: number
  dueDay: number
  ownerId: string | null
  color: string
}
