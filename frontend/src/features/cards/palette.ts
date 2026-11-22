export const CARD_COLORS = [
  { value: '#3987e5', label: 'Azul' },
  { value: '#199e70', label: 'Verde' },
  { value: '#d55181', label: 'Rosa' },
  { value: '#c98500', label: 'Âmbar' },
  { value: '#9085e9', label: 'Lilás' },
  { value: '#d95926', label: 'Laranja' },
  { value: '#008300', label: 'Folha' },
  { value: '#e66767', label: 'Coral' },
] as const

const INK = '#0b1210'

export function nextCardColor(existing: number): string {
  return CARD_COLORS[existing % CARD_COLORS.length].value
}

export function cardFinish(color: string): string {
  return [
    'radial-gradient(130% 90% at 0% 0%, rgba(255, 255, 255, 0.08), transparent 55%)',
    `linear-gradient(135deg, color-mix(in srgb, ${color} 64%, ${INK}) 0%, color-mix(in srgb, ${color} 42%, ${INK}) 100%)`,
  ].join(', ')
}
