import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { CROWDED_PATTERN_INDEX, PATTERN_FRAMES } from '../hooks/sprite'

const SPINNER = {
  plugin: 'peek-spinner',
  component: 'Spinner',
  surface: 'terminal',
  props: { word: 'Sauteing', message: null, suffix: '…', mode: 'thinking' },
} as const

const CROWDED_FRAMES = PATTERN_FRAMES[CROWDED_PATTERN_INDEX]!

// 本物のコンテキストは埋めず、$.session.usage の答えだけを差し替える
function answerUsage(on: On, percent: () => number) {
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 200_000, percent: percent() }, rateLimits: [] },
  }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
}

async function drawnFrames(
  ui: { find: (query: { key: string }) => Promise<{ props: Record<string, unknown> } | undefined> },
  clock: { advance: (ms: number) => Promise<void> },
  count: number,
) {
  const frames: string[] = []
  for (let i = 0; i < count; i++) {
    frames.push(String((await ui.find({ key: 'peek' }))?.props.cells))
    await clock.advance(140)
  }

  return frames
}

function patternOf(frames: string[]): number {
  return PATTERN_FRAMES.findIndex(pattern => frames.every(cells => pattern.includes(cells)))
}

test('使用率が80%以上なら、あせあせを出す', async ($, on) => {
  const clock = mock.clock(on)
  answerUsage(on, () => 85)
  await $.turn.start({ text: '', turnId: 't1' })

  const ui = await $.ui.mount(SPINNER)

  expect(patternOf(await drawnFrames(ui, clock, 30))).toBe(CROWDED_PATTERN_INDEX)
  await ui.unmount()
})

test('使用率が80%未満なら、あせあせ以外の1つの動きをターンの間ずっと繰り返す', async ($, on) => {
  const clock = mock.clock(on)
  answerUsage(on, () => 50)
  await $.turn.start({ text: '', turnId: 't1' })

  const ui = await $.ui.mount(SPINNER)
  const pattern = patternOf(await drawnFrames(ui, clock, 60))

  expect(pattern).toBeGreaterThanOrEqual(0)
  expect(pattern).not.toBe(CROWDED_PATTERN_INDEX)
  await ui.unmount()
})

test('次のターンでは、前のターンと違う動きになる', async ($, on) => {
  const clock = mock.clock(on)
  answerUsage(on, () => 50)
  const ui = await $.ui.mount(SPINNER)

  const patterns: number[] = []
  for (const turnId of ['t1', 't2', 't3', 't4', 't5']) {
    await $.turn.start({ text: '', turnId })
    patterns.push(patternOf(await drawnFrames(ui, clock, 24)))
    await $.turn.complete({ turnId, reason: 'answer', answer: '', durationMs: 0, isAborted: false })
  }

  patterns.slice(1).forEach((pattern, i) => expect(pattern).not.toBe(patterns[i]))
  await ui.unmount()
})

test('ターンの途中で80%を超えても動きは変えず、次のターンからあせあせにする', async ($, on) => {
  const clock = mock.clock(on)
  let percent = 50
  answerUsage(on, () => percent)
  const ui = await $.ui.mount(SPINNER)

  await $.turn.start({ text: '', turnId: 't1' })
  const first = patternOf(await drawnFrames(ui, clock, 12))
  percent = 85
  expect(patternOf(await drawnFrames(ui, clock, 36))).toBe(first)
  await $.turn.complete({ turnId: 't1', reason: 'answer', answer: '', durationMs: 0, isAborted: false })

  await $.turn.start({ text: '', turnId: 't2' })
  expect(patternOf(await drawnFrames(ui, clock, 12))).toBe(CROWDED_PATTERN_INDEX)
  await ui.unmount()
})
