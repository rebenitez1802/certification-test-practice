import type { Attempt, ChapterStat, Question, TestResult } from '../types'

/** A question scores a point only when the selected set exactly matches the correct set. */
export function isCorrect(question: Question, answer: number[] | null): boolean {
  if (!answer || answer.length !== question.correct.length) return false
  const selected = [...answer].sort((a, b) => a - b)
  const correct = [...question.correct].sort((a, b) => a - b)
  return selected.every((v, i) => v === correct[i])
}

export function scoreAttempt(attempt: Attempt, passPercent: number): TestResult {
  const { questions, answers } = attempt
  const byChapterMap = new Map<string, ChapterStat>()
  let correct = 0

  questions.forEach((q, i) => {
    const stat = byChapterMap.get(q.chapter) ?? { chapter: q.chapter, correct: 0, total: 0 }
    stat.total++
    if (isCorrect(q, answers[i] ?? null)) {
      stat.correct++
      correct++
    }
    byChapterMap.set(q.chapter, stat)
  })

  const total = questions.length
  const percent = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10
  const finishedAt = attempt.finishedAt ?? attempt.startedAt
  return {
    correct,
    total,
    percent,
    passPercent,
    passed: percent >= passPercent,
    byChapter: [...byChapterMap.values()].sort((a, b) => a.chapter.localeCompare(b.chapter)),
    timeUsedSec: Math.max(0, Math.round((finishedAt - attempt.startedAt) / 1000)),
  }
}
