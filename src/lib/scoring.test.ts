import { describe, expect, it } from 'vitest'
import type { Attempt, Question } from '../types'
import { isCorrect, scoreAttempt } from './scoring'

function makeQuestion(id: string, chapter: string, correct: number[]): Question {
  return {
    id,
    chapter,
    kLevel: 'K1',
    stem: `stem ${id}`,
    options: ['a', 'b', 'c', 'd'],
    correct,
    explanation: 'because',
  }
}

function makeAttempt(questions: Question[], answers: (number[] | null)[]): Attempt {
  return {
    id: 'attempt-1',
    config: { examId: 'x', mode: 'custom', chapters: [], questionCount: questions.length, timeLimitMinutes: null },
    questions,
    answers,
    flagged: questions.map(() => false),
    currentIndex: 0,
    startedAt: 1_000_000,
    finishedAt: 1_090_000,
  }
}

describe('isCorrect', () => {
  const single = makeQuestion('q1', '1', [2])
  const multi = makeQuestion('q2', '1', [1, 3])

  it('handles single-answer questions', () => {
    expect(isCorrect(single, [2])).toBe(true)
    expect(isCorrect(single, [1])).toBe(false)
    expect(isCorrect(single, null)).toBe(false)
    expect(isCorrect(single, [])).toBe(false)
  })

  it('requires the exact set for multi-answer questions', () => {
    expect(isCorrect(multi, [3, 1])).toBe(true)
    expect(isCorrect(multi, [1])).toBe(false)
    expect(isCorrect(multi, [1, 2])).toBe(false)
    expect(isCorrect(multi, [1, 2, 3])).toBe(false)
  })
})

describe('scoreAttempt', () => {
  const questions = [
    makeQuestion('q1', '1', [0]),
    makeQuestion('q2', '1', [1]),
    makeQuestion('q3', '2', [2]),
    makeQuestion('q4', '2', [0, 1]),
  ]

  it('computes score, percent, and per-chapter stats', () => {
    const attempt = makeAttempt(questions, [[0], [3], [2], [0, 1]])
    const result = scoreAttempt(attempt, 65)
    expect(result.correct).toBe(3)
    expect(result.total).toBe(4)
    expect(result.percent).toBe(75)
    expect(result.passed).toBe(true)
    expect(result.byChapter).toEqual([
      { chapter: '1', correct: 1, total: 2 },
      { chapter: '2', correct: 2, total: 2 },
    ])
    expect(result.timeUsedSec).toBe(90)
  })

  it('treats unanswered questions as incorrect', () => {
    const attempt = makeAttempt(questions, [null, null, null, null])
    const result = scoreAttempt(attempt, 65)
    expect(result.correct).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('passes exactly at the pass mark', () => {
    const forty = Array.from({ length: 40 }, (_, i) => makeQuestion(`q${i}`, '1', [0]))
    const answers = forty.map((_, i) => (i < 26 ? [0] : [1]))
    const result = scoreAttempt(makeAttempt(forty, answers), 65)
    expect(result.percent).toBe(65)
    expect(result.passed).toBe(true)
  })
})
