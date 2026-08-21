import type { Exam, Question } from '../types'

// Any directory under src/data/ with an exam.json and chapter-*.json files
// becomes an available exam — no code changes needed to add a certification.
const examModules = import.meta.glob<Exam>('../data/*/exam.json', {
  eager: true,
  import: 'default',
})
const questionModules = import.meta.glob<Question[]>('../data/*/chapter-*.json', {
  eager: true,
  import: 'default',
})

function examIdFromPath(path: string): string {
  const match = path.match(/\.\.\/data\/([^/]+)\//)
  if (!match) throw new Error(`Unexpected data module path: ${path}`)
  return match[1]
}

export const exams: Exam[] = Object.values(examModules).sort((a, b) => a.name.localeCompare(b.name))

const banks = new Map<string, Question[]>()
for (const [path, questions] of Object.entries(questionModules)) {
  const examId = examIdFromPath(path)
  banks.set(examId, [...(banks.get(examId) ?? []), ...questions])
}
for (const bank of banks.values()) {
  bank.sort((a, b) => a.id.localeCompare(b.id))
}

export function getExam(examId: string): Exam | undefined {
  return exams.find((e) => e.id === examId)
}

export function getBank(examId: string): Question[] {
  return banks.get(examId) ?? []
}

export function chapterCounts(examId: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const q of getBank(examId)) {
    counts[q.chapter] = (counts[q.chapter] ?? 0) + 1
  }
  return counts
}
