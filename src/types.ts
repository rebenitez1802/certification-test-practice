export interface Chapter {
  id: string
  title: string
}

export interface MockSpec {
  totalQuestions: number
  timeLimitMinutes: number
  passPercent: number
  /** chapter id -> number of questions in a full mock exam */
  distribution: Record<string, number>
}

export interface Exam {
  id: string
  name: string
  shortName: string
  syllabusVersion: string
  description: string
  chapters: Chapter[]
  mock: MockSpec
}

export type KLevel = 'K1' | 'K2' | 'K3'

export interface Question {
  id: string
  chapter: string
  kLevel: KLevel
  stem: string
  options: string[]
  /** 0-based indices into options; length > 1 for "select TWO" questions */
  correct: number[]
  explanation: string
}

export interface TestConfig {
  examId: string
  mode: 'mock' | 'custom'
  chapters: string[]
  questionCount: number
  timeLimitMinutes: number | null
}

export interface Attempt {
  id: string
  config: TestConfig
  /** snapshot of the generated test: questions with options already shuffled */
  questions: Question[]
  /** per question: selected option indices, or null if unanswered */
  answers: (number[] | null)[]
  flagged: boolean[]
  currentIndex: number
  startedAt: number
  finishedAt?: number
}

export interface ChapterStat {
  chapter: string
  correct: number
  total: number
}

export interface TestResult {
  correct: number
  total: number
  percent: number
  passPercent: number
  passed: boolean
  byChapter: ChapterStat[]
  timeUsedSec: number
}
