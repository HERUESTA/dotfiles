import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import type { Motion } from '../types'
import { CALM_PATTERN_COUNT, CROWDED_PATTERN_INDEX, PATTERN_FRAMES, ROWS, WIDTH } from './sprite'

const motion = atom({ plugin: 'peek-spinner', key: 'motion' } as const, { pattern: 0, step: 0 } as Motion, {
  shape: 'motion-1',
})

const FRAME_MS = 140
const CROWDED_PERCENT = 80

function randomCalmPattern(except: number | undefined): number {
  const candidates = [...Array(CALM_PATTERN_COUNT).keys()].filter(i => i !== except)

  return candidates[Math.floor(Math.random() * candidates.length)]!
}

export const register: Register = on => {
  let timer: Timer | undefined
  let lastCalmPattern: number | undefined

  const stop = () => {
    timer?.cancel()
    timer = undefined
  }

  // 動きはターンの始めに1つ決め、そのターンの間は同じ動きを繰り返す
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      stop()
      const { context } = await $.session.usage()
      const isCrowded = (context.percent ?? 0) >= CROWDED_PERCENT
      const pattern = isCrowded ? CROWDED_PATTERN_INDEX : randomCalmPattern(lastCalmPattern)
      if (!isCrowded) {
        lastCalmPattern = pattern
      }
      await update($, motion, () => ({ pattern, step: 0 }))
      timer = $.clock.every(FRAME_MS, () => {
        void update($, motion, current => ({
          pattern: current.pattern,
          step: (current.step + 1) % PATTERN_FRAMES[current.pattern]!.length,
        }))
      })
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      stop()
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (e.surface !== 'terminal') {
      return next(e)
    }

    const { Box, Raster } = $.ui.resolve(e)
    const { pattern, step } = await read($, motion)
    const frames = PATTERN_FRAMES[pattern] ?? PATTERN_FRAMES[0]!
    const line = await next(e)

    return (
      <Box flexDirection="row" alignItems="flex-end">
        <Raster key="peek" columns={WIDTH} rows={ROWS} cells={frames[step % frames.length]!} />
        <Box marginLeft={1}>{line}</Box>
      </Box>
    )
  })
}
