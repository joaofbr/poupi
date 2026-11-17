import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ANIMATED_QUERY, WIDE_QUERY } from './motion'
import { CLOSE_DAY, HERO_DAY, brl, entry, monthTotals, pad2 } from '../data/story'

declare global {
  interface Window {
    __poupiScenes?: boolean
  }
}

interface Scene {
  measure: () => void
  render: () => void
}

interface Mode {
  wide: boolean
  navBottom: () => number
}

const APP_WIDTH = 390
const APP_HEIGHT = 844
const APP_NAV = 84

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const range = (value: number, from: number, to: number) => clamp01((value - from) / (to - from))

function need<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const found = root.querySelector<T>(selector.startsWith('.') || selector.startsWith('[') ? selector : `[data-el="${selector}"]`)
  if (!found) throw new Error(`Elemento ${selector} não encontrado`)
  return found
}

const written = new WeakMap<Element, string>()

function write(node: Element, value: string) {
  if (written.get(node) === value) return
  node.textContent = value
  written.set(node, value)
}

function fitScreens() {
  document.querySelectorAll<HTMLElement>('.screen').forEach((screen) => {
    const width = screen.clientWidth
    if (!width) return
    const scale = String(width / APP_WIDTH)
    if (screen.dataset.k === scale) return
    screen.dataset.k = scale
    screen.style.setProperty('--k', scale)
  })
}

function panels(root: ParentNode) {
  const list = [...root.querySelectorAll<HTMLElement>('[data-panel]')]
  let current = ''
  return (id: string) => {
    if (id === current) return
    current = id
    list.forEach((panel) => panel.classList.toggle('on', panel.dataset.panel === id))
  }
}

function calendar(root: ParentNode) {
  const days = [...root.querySelectorAll<HTMLElement>('.cal-day')]
  const ticks = [...root.querySelectorAll<HTMLElement>('.ticks i')]
  const label = root.querySelector<HTMLElement>('[data-el="strip-day"]')
  let current = 0
  return (today: number) => {
    if (today === current) return
    current = today
    const state = (day: number) => (day < today ? 'past' : day === today ? 'now' : '')
    days.forEach((node, index) => {
      node.className = `cal-day ${state(index + 1)}`.trim()
    })
    ticks.forEach((node, index) => {
      node.className = state(index + 1)
    })
    if (label) write(label, `Dia ${pad2(today)}`)
  }
}

function pan(stage: HTMLElement, phone: HTMLElement, mode: Mode) {
  let overflow = 0
  return {
    measure() {
      overflow = mode.wide ? 0 : Math.max(0, phone.offsetHeight - stage.clientHeight)
    },
    apply(focus: number, fade = true) {
      const shift = Math.round(overflow * clamp01(focus))
      phone.style.translate = shift ? `0 ${-shift}px` : ''
      if (!fade) return
      stage.style.setProperty('--fade-top', shift > 2 ? '24px' : '0px')
      stage.style.setProperty('--fade-bottom', overflow - shift > 2 ? '40px' : '0px')
    },
  }
}

function measureStory(root: ParentNode, mode: Mode) {
  const story = root.querySelector<HTMLElement>('.story')
  if (!story) return
  if (mode.wide) {
    story.style.removeProperty('--story-h')
    return
  }
  const heights = [...story.querySelectorAll<HTMLElement>('.panel')].map((panel) => panel.offsetHeight)
  story.style.setProperty('--story-h', `${Math.ceil(Math.max(0, ...heights))}px`)
}

function pinned(trigger: Element, mode: Mode, length: number, scrub = 0.6): ScrollTrigger.Vars {
  return {
    trigger,
    start: () => `top ${mode.navBottom()}px`,
    end: () => `+=${Math.round(window.innerHeight * length)}`,
    pin: true,
    scrub,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  }
}

function rootOf(section: HTMLElement) {
  return need(section, '[data-root]')
}

function setupHero(section: HTMLElement, mode: Mode): Scene {
  const root = rootOf(section)
  const phone = need(root, 'phone')
  const view = pan(need(root, 'stage'), phone, mode)
  const screen = need(phone, '.screen')
  const measure = () => {
    view.measure()
    view.apply(1)
  }
  measure()

  const center = (node: Element) => {
    const rect = node.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }
  const flight = (fly: HTMLElement, target: HTMLElement) => {
    const from = center(fly)
    const to = center(target)
    const baseX = from.x - Number(gsap.getProperty(fly, 'x'))
    const baseY = from.y - Number(gsap.getProperty(fly, 'y'))
    const scale = screen.clientWidth / APP_WIDTH
    const ratio = (parseFloat(getComputedStyle(target).fontSize) * scale) / parseFloat(getComputedStyle(fly).fontSize)
    return { x: to.x - baseX, y: to.y - baseY, scale: Math.max(0.12, ratio * 1.05) }
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: pinned(mode.wide ? section : need(root, 'play'), mode, mode.wide ? 1.05 : 1, 0.8),
  })
  const order = ['valor', 'desc', 'data', 'cartao']
  order.forEach((name, index) => {
    const word = need(root, `.w[data-slot="${name}"]`)
    const fly = need(word, '.fly')
    const ghost = need(word, '.ghost')
    const slot = need(root, `.slot[data-target="${name}"]`)
    const value = need(slot, '.val')
    const at = 0.1 + index * 0.55
    timeline
      .set(ghost, { visibility: 'visible', opacity: 0 }, at)
      .to(ghost, { opacity: 0.22, duration: 0.3, ease: 'none' }, at)
      .to(
        fly,
        {
          x: () => flight(fly, value).x,
          y: () => flight(fly, value).y,
          scale: () => flight(fly, value).scale,
          duration: 0.7,
        },
        at,
      )
      .to(fly, { opacity: 0, duration: 0.15, ease: 'none' }, at + 0.6)
      .fromTo(need(slot, '.ph'), { opacity: 1 }, { opacity: 0, duration: 0.15, ease: 'none', immediateRender: false }, at + 0.55)
      .fromTo(value, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none', immediateRender: false }, at + 0.6)
    const chip = root.querySelector(`[data-chip="${name}"]`)
    if (chip && mode.wide) {
      timeline.fromTo(chip, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power1.out' }, at + 0.62)
    }
    if (name === 'desc') {
      const category = need(root, '.slot[data-target="categoria"]')
      timeline
        .fromTo(need(category, '.ph'), { opacity: 1 }, { opacity: 0, duration: 0.15, ease: 'none', immediateRender: false }, at + 0.7)
        .fromTo(need(category, '.val'), { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none', immediateRender: false }, at + 0.75)
    }
  })
  const end = 0.1 + order.length * 0.55 + 0.35
  const confirm = need(root, 'confirm')
  timeline
    .to(confirm, { scale: 0.95, duration: 0.15, ease: 'power1.in' }, end)
    .to(confirm, { scale: 1, duration: 0.15, ease: 'power1.out' }, end + 0.15)
    .to(need(root, 'sheet'), { yPercent: 100, duration: 0.7, ease: 'power2.in' }, end + 0.3)
    .to(need(root, 'overlay'), { opacity: 0, duration: 0.6, ease: 'none' }, end + 0.35)
    .fromTo(
      need(root, 'toast'),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out', immediateRender: false },
      end + 0.8,
    )
    .to({}, { duration: 0.25 })
  const chips = root.querySelectorAll('[data-chip]')
  if (chips.length && mode.wide) timeline.to(chips, { autoAlpha: 0, duration: 0.4, ease: 'none' }, end + 0.3)

  return { measure, render: () => view.apply(1) }
}

function setupMonth(section: HTMLElement, mode: Mode): Scene {
  const root = rootOf(section)
  const stage = need(root, 'stage')
  const view = pan(stage, need(root, 'phone'), mode)
  const rows = [...root.querySelectorAll<HTMLElement>('[data-id]')].map((node) => {
    const item = entry(node.dataset.id ?? '')
    return { node, day: item.day, cents: Math.round(item.amount * 100) }
  })
  const salary = Math.round(entry('salario').amount * 100)
  const saldo = need(root, 'saldo')
  const income = need(root, 'receitas')
  const expense = need(root, 'despesas')
  const overlay = need(root, 'overlay')
  const sheet = need(root, 'sheet')
  const chip = root.querySelector<HTMLElement>('[data-el="chip"]')
  const showPanel = panels(root)
  const showDay = calendar(root)
  const state = { day: 0, sheet: 0, confirm: 0, closing: 0 }

  const render = () => {
    const today = Math.min(5, Math.max(1, Math.round(state.day + 0.5)))
    const closed = clamp01(state.confirm / 0.45)
    const counted = range(state.confirm, 0.4, 1)
    const salaryIn = state.confirm >= 0.4
    let spent = 0
    let first = true
    rows.forEach((row) => {
      const visible = row.cents > 0 ? salaryIn : state.day >= row.day - 0.5
      row.node.style.display = visible ? '' : 'none'
      row.node.classList.toggle('is-first', visible && first)
      if (visible) first = false
      if (visible && row.cents < 0) spent -= row.cents
    })
    const received = Math.round(salary * counted)
    const balance = (received - spent) / 100
    write(expense, brl(spent / 100))
    write(income, brl(received / 100))
    write(saldo, brl(balance))
    saldo.classList.toggle('neg', balance < 0)
    saldo.classList.toggle('pos', balance >= 0)
    const up = state.confirm > 0 ? 1 - closed : state.sheet
    sheet.style.transform = `translateY(${(1 - up) * 100}%)`
    overlay.style.opacity = String(up)
    if (chip) {
      const shown = range(state.closing, 0.15, 0.65)
      chip.style.opacity = String(shown)
      chip.style.visibility = shown > 0.01 ? 'visible' : 'hidden'
      chip.style.transform = `translateY(${(1 - shown) * 14}px)`
    }
    showPanel(state.closing >= 0.15 ? 'c' : state.sheet >= 0.1 ? 'b' : 'a')
    showDay(today)
    view.apply(0.3 + 0.7 * up)
  }
  const measure = () => {
    measureStory(root, mode)
    view.measure()
  }
  measure()

  gsap
    .timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: pinned(section, mode, 1.5) })
    .to(state, { day: 4.99, duration: 1.1 })
    .to(state, { day: 5, duration: 0.05 })
    .to(state, { sheet: 1, duration: 0.55, ease: 'power2.out' })
    .to(state, { confirm: 1, duration: 0.85, ease: 'power1.inOut' })
    .to({}, { duration: 0.15 })
    .to(state, { closing: 1, duration: 0.7 })
    .to({}, { duration: 0.25 })

  return { measure, render }
}

function setupFamily(section: HTMLElement, mode: Mode): Scene {
  const root = rootOf(section)
  const stage = need(root, 'stage')
  const phoneA = need(root, 'phone-a')
  const phoneB = need(root, 'phone-b')
  const viewA = pan(stage, phoneA, mode)
  const viewB = pan(stage, phoneB, mode)
  const overlay = need(root, 'overlay')
  const sheet = need(root, 'sheet')
  const toast = need(root, 'toast')
  const fresh = need(root, 'new-row')
  const list = need(root, 'list')
  const report = need(root, 'report')
  const chip = root.querySelector<HTMLElement>('[data-el="chip"]')
  const bars = [...root.querySelectorAll<HTMLElement>('[data-bar]')]
  const showPanel = panels(root)
  const state = { sheet: 0, confirm: 0, swap: 0, report: 0 }
  let rowHeight = 62

  const render = () => {
    const closed = clamp01(state.confirm / 0.5)
    const up = state.confirm > 0 ? 1 - closed : state.sheet
    sheet.style.transform = `translateY(${(1 - up) * 100}%)`
    overlay.style.opacity = String(up)
    const toastIn = range(state.confirm, 0.55, 0.85)
    toast.style.opacity = String(toastIn * (1 - range(state.swap, 0, 0.5)))
    toast.style.transform = `translateY(${(1 - toastIn) * 10}px)`
    const front = clamp01(state.swap)
    if (mode.wide) {
      phoneA.style.transform = `scale(${1 - 0.07 * front})`
      phoneA.style.filter = `brightness(${1 - 0.03 * front}) saturate(${1 - 0.15 * front})`
      phoneB.style.transform = `scale(${0.93 + 0.07 * front})`
      phoneB.style.filter = `brightness(${0.97 + 0.03 * front}) saturate(${0.85 + 0.15 * front})`
      phoneA.style.zIndex = front > 0.5 ? '1' : '2'
      phoneB.style.zIndex = front > 0.5 ? '2' : '1'
    } else {
      phoneA.style.opacity = String(1 - front)
      phoneB.style.opacity = String(front)
      phoneA.style.visibility = front > 0.99 ? 'hidden' : ''
      phoneB.style.visibility = front < 0.01 ? 'hidden' : ''
    }
    const rowIn = range(state.swap, 0.35, 0.8)
    fresh.style.height = `${rowIn * rowHeight}px`
    fresh.style.opacity = String(rowIn)
    if (chip) {
      const shown = range(state.swap, 0.6, 0.9) * (1 - range(state.report, 0, 0.3))
      chip.style.opacity = String(shown)
      chip.style.visibility = shown > 0.01 ? 'visible' : 'hidden'
    }
    list.style.opacity = String(1 - range(state.report, 0, 0.4))
    report.style.opacity = String(range(state.report, 0, 0.4))
    const grow = range(state.report, 0.35, 1)
    bars.forEach((bar) => {
      bar.style.width = `${Number(bar.dataset.bar) * grow}%`
    })
    showPanel(state.report >= 0.3 ? 'c' : state.swap >= 0.3 ? 'b' : 'a')
    viewA.apply(1, front < 0.5)
    viewB.apply(0, front >= 0.5)
  }
  const measure = () => {
    measureStory(root, mode)
    viewA.measure()
    viewB.measure()
    const row = fresh.firstElementChild as HTMLElement | null
    if (row?.offsetHeight) rowHeight = row.offsetHeight
  }
  measure()

  gsap
    .timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: pinned(section, mode, 1.4) })
    .to(state, { sheet: 1, duration: 0.45, ease: 'power2.out' })
    .to(state, { confirm: 1, duration: 0.7, ease: 'power1.inOut' })
    .to(state, { swap: 1, duration: 0.7, ease: 'power1.inOut' })
    .to({}, { duration: 0.15 })
    .to(state, { report: 1, duration: 0.7 })
    .to({}, { duration: 0.25 })

  return { measure, render }
}

function setupCard(section: HTMLElement, mode: Mode): Scene {
  const root = rootOf(section)
  const view = pan(need(root, 'stage'), need(root, 'phone'), mode)
  const marketWrap = need(root, 'market-row')
  const uberWrap = need(root, 'uber-row')
  const marketRow = need(marketWrap, '.a-row')
  const bill = need(root, 'bill')
  const total = need(root, 'bill-total')
  const chip = root.querySelector<HTMLElement>('[data-el="chip"]')
  const chipTotal = root.querySelector<HTMLElement>('[data-el="chip-total"]')
  const market = Math.round(-entry('mercado-cartao').amount * 100)
  const uber = Math.round(-entry('uber').amount * 100)
  const showPanel = panels(root)
  const showDay = calendar(root)
  const state = { market: 0, uber: 0 }
  let rowHeight = 62

  const render = () => {
    const marketIn = range(state.market, 0, 0.6)
    const uberIn = range(state.uber, 0, 0.6)
    marketWrap.style.height = `${marketIn * rowHeight}px`
    marketWrap.style.opacity = String(marketIn)
    uberWrap.style.height = `${uberIn * rowHeight}px`
    uberWrap.style.opacity = String(uberIn)
    marketRow.classList.toggle('is-first', uberIn === 0)
    bill.style.opacity = String(range(state.market, 0, 0.35))
    const cents = Math.round(market * range(state.market, 0.15, 0.8)) + Math.round(uber * range(state.uber, 0.2, 0.8))
    write(total, brl(cents / 100))
    if (chipTotal) write(chipTotal, brl(cents / 100))
    if (chip) {
      const shown = range(state.market, 0.4, 0.8)
      chip.style.opacity = String(shown)
      chip.style.visibility = shown > 0.01 ? 'visible' : 'hidden'
      chip.style.transform = `translateY(${(1 - shown) * 14}px)`
    }
    showDay(12 + Math.round(3 * range(state.uber, 0, 0.5)))
    showPanel(state.uber >= 0.15 ? 'b' : 'a')
    view.apply(0.5)
  }
  const measure = () => {
    measureStory(root, mode)
    view.measure()
    if (marketRow.offsetHeight) rowHeight = marketRow.offsetHeight
  }
  measure()

  gsap
    .timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: pinned(section, mode, 1.1) })
    .to(state, { market: 1, duration: 0.8, ease: 'power1.inOut' })
    .to({}, { duration: 0.35 })
    .to(state, { uber: 1, duration: 0.8, ease: 'power1.inOut' })
    .to({}, { duration: 0.35 })

  return { measure, render }
}

function setupClose(section: HTMLElement, mode: Mode): Scene {
  const root = rootOf(section)
  const phone = need(root, 'phone')
  const view = pan(need(root, 'stage'), phone, mode)
  const app = need(phone, '.app')
  const screen = need(phone, '.screen')
  const body = need(root, 'body')
  const card = need(root, 'donut-card')
  const legend = need(root, 'legend')
  const saldo = need(root, 'saldo')
  const income = need(root, 'receitas')
  const expense = need(root, 'despesas')
  const donutTotal = need(root, 'donut-total')
  const segments = [...root.querySelectorAll<SVGCircleElement>('circle[data-start]')].map((node) => ({
    node,
    start: Number(node.dataset.start),
    length: Number(node.dataset.length),
  }))
  const steps = [HERO_DAY, 18, 20, 22, 27].map((day) => ({ day, ...monthTotals(day) }))
  const showPanel = panels(root)
  const showDay = calendar(root)
  const state = { rest: 0, close: 0 }
  let scroll = 0
  let shift = 0

  const render = () => {
    const today =
      state.close > 0
        ? Math.min(CLOSE_DAY, 27 + Math.round(3 * range(state.close, 0, 0.25)))
        : Math.round(HERO_DAY + (27 - HERO_DAY) * state.rest)
    let totals = steps[0]
    for (const step of steps) if (step.day <= today) totals = step
    write(saldo, brl(totals.balance))
    write(income, brl(totals.income))
    write(expense, brl(totals.expense))
    write(donutTotal, brl(totals.expense))
    shift = Math.round(scroll * range(state.close, 0.05, 0.45))
    body.style.translate = shift ? `0 ${-shift}px` : ''
    const sweep = 100 * range(state.close, 0.3, 0.9)
    segments.forEach(({ node, start, length }) => {
      const drawn = Math.max(0, Math.min(length, sweep - start))
      node.setAttribute('stroke-dasharray', `${drawn} ${100 - drawn}`)
      node.style.opacity = drawn > 0 ? '' : '0'
    })
    legend.style.opacity = String(range(state.close, 0.45, 0.85))
    showDay(today)
    showPanel(state.close >= 0.12 ? 'b' : 'a')
    view.apply(0.15 + 0.85 * range(state.close, 0.05, 0.45))
  }
  const measure = () => {
    measureStory(root, mode)
    view.measure()
    const scale = screen.clientWidth / APP_WIDTH
    if (!scale) return
    const bottom = (card.getBoundingClientRect().bottom - app.getBoundingClientRect().top) / scale + shift
    scroll = Math.max(0, Math.ceil(bottom + 14 - (APP_HEIGHT - APP_NAV)))
  }
  measure()

  gsap
    .timeline({ defaults: { ease: 'none' }, onUpdate: render, scrollTrigger: pinned(section, mode, 1.3) })
    .to(state, { rest: 1, duration: 1.1 })
    .to({}, { duration: 0.15 })
    .to(state, { close: 1, duration: 1.1 })
    .to({}, { duration: 0.3 })

  return { measure, render }
}

function whenStylesReady(): Promise<void> {
  const pending = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((link) => !link.sheet)
  return Promise.all(
    pending.map(
      (link) =>
        new Promise<void>((resolve) => {
          link.addEventListener('load', () => resolve(), { once: true })
          link.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ).then(() => undefined)
}

export function startScenes() {
  window.__poupiScenes = true
  whenStylesReady().then(runScenes)
}

function runScenes() {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  const html = document.documentElement
  const nav = document.querySelector<HTMLElement>('.nav')
  const scene = (name: string) => need(document, `[data-scene="${name}"]`)
  const roots = [...document.querySelectorAll<HTMLElement>('[data-root]')]
  const snapshots = roots.map((root) => root.innerHTML)
  let scenes: Scene[] = []

  const restore = () => {
    scenes = []
    roots.forEach((root, index) => {
      root.innerHTML = snapshots[index]
    })
    html.classList.remove('is-animated')
    fitScreens()
  }

  ScrollTrigger.addEventListener('refreshInit', () => {
    fitScreens()
    scenes.forEach((item) => item.measure())
  })
  ScrollTrigger.addEventListener('refresh', () => scenes.forEach((item) => item.render()))

  fitScreens()
  new ResizeObserver(() => fitScreens()).observe(document.body)

  gsap.matchMedia().add({ animated: ANIMATED_QUERY, wide: WIDE_QUERY }, (context) => {
    const { animated, wide } = context.conditions as { animated: boolean; wide: boolean }
    if (!animated) {
      html.classList.remove('is-animated')
      fitScreens()
      return
    }
    html.classList.add('is-animated')
    fitScreens()
    const mode: Mode = { wide, navBottom: () => Math.round(nav?.getBoundingClientRect().bottom ?? 0) }
    try {
      scenes = [
        setupHero(scene('hero'), mode),
        setupMonth(scene('month'), mode),
        setupFamily(scene('family'), mode),
        setupCard(scene('card'), mode),
        setupClose(scene('close'), mode),
      ]
      scenes.forEach((item) => item.render())
    } catch (error) {
      console.error(error)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true))
      restore()
      return
    }
    return restore
  })

  const refresh = () => {
    fitScreens()
    ScrollTrigger.refresh()
  }
  document.fonts?.ready.then(refresh)
  if (document.readyState !== 'complete') window.addEventListener('load', refresh, { once: true })
}
