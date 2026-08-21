import type { Question } from '../types'

export type Rng = () => number

/** Deterministic RNG (mulberry32) for tests and reproducible draws. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], rand: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Shuffle a question's options, remapping the correct indices to match. */
export function shuffleOptions(question: Question, rand: Rng = Math.random): Question {
  const order = shuffle(question.options.map((_, i) => i), rand)
  return {
    ...question,
    options: order.map((from) => question.options[from]),
    correct: question.correct.map((c) => order.indexOf(c)).sort((a, b) => a - b),
  }
}

export interface GenerateSpec {
  /** chapter id -> question count. Chapters missing from the bank are drawn as far as possible. */
  distribution: Record<string, number>
}

/**
 * Draw a random test from the bank following a per-chapter distribution.
 * If a chapter has fewer questions than requested, the shortfall is filled
 * with random questions from the remaining selected chapters.
 * Returned questions have shuffled options and come in shuffled order.
 */
export function generateTest(bank: Question[], spec: GenerateSpec, rand: Rng = Math.random): Question[] {
  const picked: Question[] = []
  const leftovers: Question[] = []
  let shortfall = 0

  for (const [chapter, count] of Object.entries(spec.distribution)) {
    const pool = shuffle(bank.filter((q) => q.chapter === chapter), rand)
    picked.push(...pool.slice(0, count))
    leftovers.push(...pool.slice(count))
    shortfall += Math.max(0, count - pool.length)
  }
  if (shortfall > 0) {
    picked.push(...shuffle(leftovers, rand).slice(0, shortfall))
  }

  return shuffle(picked, rand).map((q) => shuffleOptions(q, rand))
}

/** Build an even distribution of `count` questions across the given chapters, capped by availability. */
export function evenDistribution(bank: Question[], chapters: string[], count: number): Record<string, number> {
  const available = new Map(chapters.map((c) => [c, bank.filter((q) => q.chapter === c).length]))
  const total = [...available.values()].reduce((a, b) => a + b, 0)
  const target = Math.min(count, total)

  const result: Record<string, number> = Object.fromEntries(chapters.map((c) => [c, 0]))
  let assigned = 0
  // round-robin so the draw stays balanced even when some chapters run dry
  while (assigned < target) {
    let progressed = false
    for (const c of chapters) {
      if (assigned >= target) break
      if (result[c] < (available.get(c) ?? 0)) {
        result[c]++
        assigned++
        progressed = true
      }
    }
    if (!progressed) break
  }
  return result
}
