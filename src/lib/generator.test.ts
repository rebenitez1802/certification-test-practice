import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { createRng, evenDistribution, generateTest, shuffle, shuffleOptions } from './generator'

function makeQuestion(id: string, chapter: string, correct: number[] = [0]): Question {
  return {
    id,
    chapter,
    kLevel: 'K1',
    stem: `stem ${id}`,
    options: ['option A', 'option B', 'option C', 'option D'],
    correct,
    explanation: 'because',
  }
}

function makeBank(perChapter: Record<string, number>): Question[] {
  return Object.entries(perChapter).flatMap(([chapter, n]) =>
    Array.from({ length: n }, (_, i) => makeQuestion(`q-${chapter}-${i}`, chapter)),
  )
}

describe('shuffle', () => {
  it('keeps the same elements and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    const result = shuffle(input, createRng(1))
    expect(input).toEqual(copy)
    expect([...result].sort()).toEqual([...input].sort())
  })
})

describe('shuffleOptions', () => {
  it('remaps correct indices so they still point at the right options', () => {
    const question = makeQuestion('q1', '1', [1, 3])
    const correctTexts = question.correct.map((i) => question.options[i]).sort()
    for (let seed = 0; seed < 20; seed++) {
      const shuffled = shuffleOptions(question, createRng(seed))
      expect(shuffled.correct.map((i) => shuffled.options[i]).sort()).toEqual(correctTexts)
      expect([...shuffled.options].sort()).toEqual([...question.options].sort())
    }
  })
})

describe('generateTest', () => {
  const bank = makeBank({ '1': 10, '2': 10, '3': 10 })

  it('draws the requested number per chapter with no duplicates', () => {
    const test = generateTest(bank, { distribution: { '1': 4, '2': 2, '3': 5 } }, createRng(42))
    expect(test).toHaveLength(11)
    expect(new Set(test.map((q) => q.id)).size).toBe(11)
    expect(test.filter((q) => q.chapter === '1')).toHaveLength(4)
    expect(test.filter((q) => q.chapter === '2')).toHaveLength(2)
    expect(test.filter((q) => q.chapter === '3')).toHaveLength(5)
  })

  it('fills shortfalls from other selected chapters', () => {
    const small = makeBank({ '1': 2, '2': 10 })
    const test = generateTest(small, { distribution: { '1': 5, '2': 3 } }, createRng(7))
    expect(test).toHaveLength(8)
    expect(test.filter((q) => q.chapter === '1')).toHaveLength(2)
    expect(test.filter((q) => q.chapter === '2')).toHaveLength(6)
  })

  it('caps at the bank size when asking for more than exists', () => {
    const small = makeBank({ '1': 3 })
    const test = generateTest(small, { distribution: { '1': 10 } }, createRng(7))
    expect(test).toHaveLength(3)
  })

  it('produces different draws for different seeds', () => {
    const a = generateTest(bank, { distribution: { '1': 5, '2': 5 } }, createRng(1)).map((q) => q.id)
    const b = generateTest(bank, { distribution: { '1': 5, '2': 5 } }, createRng(2)).map((q) => q.id)
    expect(a).not.toEqual(b)
  })
})

describe('evenDistribution', () => {
  it('spreads the count across chapters', () => {
    const bank = makeBank({ '1': 10, '2': 10, '3': 10 })
    expect(evenDistribution(bank, ['1', '2', '3'], 9)).toEqual({ '1': 3, '2': 3, '3': 3 })
  })

  it('respects per-chapter availability and caps the total', () => {
    const bank = makeBank({ '1': 2, '2': 10 })
    const dist = evenDistribution(bank, ['1', '2'], 10)
    expect(dist['1']).toBe(2)
    expect(dist['2']).toBe(8)
    expect(evenDistribution(bank, ['1', '2'], 100)).toEqual({ '1': 2, '2': 10 })
  })
})
