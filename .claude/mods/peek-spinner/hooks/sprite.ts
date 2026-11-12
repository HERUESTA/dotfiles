export const WIDTH = 16
const HEIGHT = 12
export const ROWS = HEIGHT / 2

// 1ドットを '.' 以外の1文字で表す。'.' は透明（ターミナルの背景色）
const PALETTE: Record<string, number> = {
  P: 0xf4a6c0, // 髪
  p: 0xd97a9c, // 髪の影
  S: 0xfbe3d6, // 肌
  B: 0x3f86e0, // 目
  K: 0x8a4a6a, // 閉じた目
  C: 0x4fb0e8, // 青い髪飾り
  Y: 0xe8c43c, // 黄色い髪飾り
  g: 0x6b6b6b, // ゴミ箱のふち・影
  G: 0x9a9a9a, // ゴミ箱
  L: 0xbdbdbd, // ゴミ箱のハイライト
  R: 0xe0608a, // 震えの線
  D: 0x9fd6f2, // 汗
}

type Eyes = 'open' | 'closed' | 'left' | 'right'

const EYES: Record<Eyes, string> = {
  open: '.PBBSSBBP.',
  closed: '.PKKSSKKP.',
  left: '.PBSSSBSP.',
  right: '.PSBSSSBP.',
}

const HAIR = ['...pPPp...', '.pPPPPPPp.', 'CPPPPPPPPp', 'YPPPPPPPPP']
const CHIN = '.PSSSSSSP.'

const BIN = [
  '.gggggggggggggg.',
  '..LGGGGGGGGGGG..',
  '..LGGGGGGGGGGG..',
  '...LGGGGGGGGG...',
  '...GGGGGGGGGG...',
  '....gggggggg....',
]

const RIM_ROW = 6
const HEAD_X = 3

// dy は頭のてっぺんの行。ふち（RIM_ROW）より上だけを描くので、増やすほど頭が沈む。dy: 1 で目まで見える
// sweat は汗の粒の数。2 は「あせあせ」専用で、ほかのパターンのコマと必ず見た目が分かれる
type Pose = {
  dy: number
  dx?: number
  binDx?: number
  eyes?: Eyes
  tremble?: 1 | 2
  sweat?: 1 | 2
}

const CALM_PATTERNS: Pose[][] = [
  // ぷるぷる: 震えてから引っ込み、また顔を出す
  [
    { dy: 1, tremble: 1 },
    { dy: 1, dx: -1, tremble: 2 },
    { dy: 1, tremble: 1, sweat: 1 },
    { dy: 1, dx: 1, tremble: 2, sweat: 1 },
    { dy: 1, tremble: 1, sweat: 1 },
    { dy: 1, dx: -1, tremble: 2 },
    { dy: 2 },
    { dy: 3 },
    { dy: 3 },
    { dy: 3 },
    { dy: 2 },
    { dy: 1 },
  ],
  // きょろきょろ: 目だけ左右に動かして、まばたきする
  [
    { dy: 1 },
    { dy: 1 },
    { dy: 1, eyes: 'left' },
    { dy: 1, eyes: 'left' },
    { dy: 1, eyes: 'left' },
    { dy: 1 },
    { dy: 1, eyes: 'right' },
    { dy: 1, eyes: 'right' },
    { dy: 1, eyes: 'right' },
    { dy: 1 },
    { dy: 1, eyes: 'closed' },
    { dy: 1 },
  ],
  // ガタガタ: 隠れたままゴミ箱ごと揺れて、そっと顔を出す
  [
    { dy: 4, binDx: -1, tremble: 1 },
    { dy: 4, binDx: 1, tremble: 2 },
    { dy: 4, binDx: -1, tremble: 1 },
    { dy: 4, binDx: 1, tremble: 2 },
    { dy: 4, binDx: -1, tremble: 1 },
    { dy: 4, binDx: 1, tremble: 2 },
    { dy: 4 },
    { dy: 3 },
    { dy: 2 },
    { dy: 1, sweat: 1 },
    { dy: 1, sweat: 1 },
    { dy: 1 },
  ],
  // ちらっ: 髪の先だけ見えている状態から一瞬のぞいて、すぐ戻る
  [
    { dy: 5 },
    { dy: 5 },
    { dy: 5 },
    { dy: 3 },
    { dy: 1, sweat: 1 },
    { dy: 1, eyes: 'closed', sweat: 1 },
    { dy: 1, sweat: 1 },
    { dy: 3 },
    { dy: 5 },
    { dy: 5 },
  ],
]

// あせあせ: コンテキストが埋まってきたときだけ出す。ゴミ箱ごと揺れ続け、汗が止まらない
const CROWDED_PATTERN: Pose[] = [
  { dy: 1, binDx: -1, tremble: 1, sweat: 2 },
  { dy: 1, binDx: 1, tremble: 2, sweat: 2 },
  { dy: 1, binDx: -1, tremble: 1, sweat: 2, eyes: 'closed' },
  { dy: 1, binDx: 1, tremble: 2, sweat: 2 },
  { dy: 2, binDx: -1, tremble: 1, sweat: 2 },
  { dy: 1, binDx: 1, tremble: 2, sweat: 2, eyes: 'left' },
  { dy: 1, binDx: -1, tremble: 1, sweat: 2, eyes: 'right' },
  { dy: 1, binDx: 1, tremble: 2, sweat: 2 },
]

const TREMBLE_MARKS: Record<1 | 2, [number, number][]> = {
  1: [[0, 7], [15, 9]],
  2: [[15, 7], [0, 9]],
}

function paint(pose: Pose): string[][] {
  const canvas = Array.from({ length: HEIGHT }, () => Array<string>(WIDTH).fill('.'))
  const put = (x: number, y: number, ch: string) => {
    if (ch !== '.' && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
      canvas[y]![x] = ch
    }
  }
  const binDx = pose.binDx ?? 0
  const headX = HEAD_X + binDx + (pose.dx ?? 0)

  ;[...HAIR, EYES[pose.eyes ?? 'open'], CHIN].forEach((line, row) => {
    const y = pose.dy + row
    if (y >= RIM_ROW) return
    ;[...line].forEach((ch, col) => put(headX + col, y, ch))
  })
  BIN.forEach((line, row) => [...line].forEach((ch, x) => put(x + binDx, RIM_ROW + row, ch)))
  if (pose.tremble !== undefined) {
    TREMBLE_MARKS[pose.tremble].forEach(([x, y]) => put(x, y, 'R'))
  }
  if (pose.sweat !== undefined) {
    put(headX + 10, pose.dy + 3, 'D')
  }
  if (pose.sweat === 2) {
    put(headX - 1, pose.dy + 3, 'D')
    put(headX + 10, pose.dy + 1, 'D')
  }

  return canvas
}

const TERMINAL_DEFAULT = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20

// 1マスに上下2ドットを詰める。上半分ブロックの文字色が上のドット、背景色が下のドットになる
function encode(canvas: string[][]): string {
  const words = new Uint32Array(WIDTH * ROWS * 3)
  for (let row = 0; row < ROWS; row++) {
    for (let x = 0; x < WIDTH; x++) {
      const top = PALETTE[canvas[row * 2]![x]!]
      const bottom = PALETTE[canvas[row * 2 + 1]![x]!]
      words.set(cellOf(top, bottom), (row * WIDTH + x) * 3)
    }
  }

  return toBase64(new Uint8Array(words.buffer))
}

function cellOf(top: number | undefined, bottom: number | undefined): [number, number, number] {
  if (top !== undefined) {
    return [UPPER_HALF, top, bottom ?? TERMINAL_DEFAULT]
  }
  if (bottom !== undefined) {
    return [LOWER_HALF, bottom, TERMINAL_DEFAULT]
  }

  return [SPACE, TERMINAL_DEFAULT, TERMINAL_DEFAULT]
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

// パターンごとのコマを、描く形（base64 の cells）にして持つ。あせあせは最後に置く
export const PATTERN_FRAMES: string[][] = [...CALM_PATTERNS, CROWDED_PATTERN].map(poses =>
  poses.map(pose => encode(paint(pose))),
)
export const CALM_PATTERN_COUNT = CALM_PATTERNS.length
export const CROWDED_PATTERN_INDEX = CALM_PATTERNS.length
