#!/usr/bin/env node
// Validates the question knowledge base under src/data/.
// Checks JSON shape, answer indices, id uniqueness, and mock distribution feasibility.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = new URL('../src/data/', import.meta.url).pathname
const K_LEVELS = new Set(['K1', 'K2', 'K3'])
const errors = []

function fail(file, message) {
  errors.push(`${file}: ${message}`)
}

const examDirs = readdirSync(DATA_DIR).filter((entry) => statSync(join(DATA_DIR, entry)).isDirectory())

let grandTotal = 0
for (const dir of examDirs) {
  const examPath = join(DATA_DIR, dir, 'exam.json')
  let exam
  try {
    exam = JSON.parse(readFileSync(examPath, 'utf8'))
  } catch (e) {
    fail(examPath, `cannot read/parse: ${e.message}`)
    continue
  }
  for (const field of ['certification', 'level', 'name', 'shortName']) {
    if (typeof exam[field] !== 'string' || !exam[field].trim()) {
      fail(examPath, `missing or empty "${field}"`)
    }
  }
  const chapterIds = new Set((exam.chapters ?? []).map((c) => c.id))
  const seenIds = new Set()
  const perChapter = {}

  const chapterFiles = readdirSync(join(DATA_DIR, dir)).filter((f) => /^chapter-.*\.json$/.test(f))
  if (chapterFiles.length === 0) fail(examPath, 'no chapter-*.json question files found')

  for (const file of chapterFiles.sort()) {
    const path = join(DATA_DIR, dir, file)
    let questions
    try {
      questions = JSON.parse(readFileSync(path, 'utf8'))
    } catch (e) {
      fail(path, `cannot parse JSON: ${e.message}`)
      continue
    }
    if (!Array.isArray(questions)) {
      fail(path, 'expected a JSON array of questions')
      continue
    }
    questions.forEach((q, i) => {
      const where = `${file}[${i}] (${q?.id ?? 'no id'})`
      if (typeof q?.id !== 'string' || !q.id) return fail(where, 'missing id')
      if (seenIds.has(q.id)) fail(where, 'duplicate id')
      seenIds.add(q.id)
      if (!chapterIds.has(q.chapter)) fail(where, `chapter "${q.chapter}" not declared in exam.json`)
      if (!K_LEVELS.has(q.kLevel)) fail(where, `invalid kLevel "${q.kLevel}"`)
      if (typeof q.stem !== 'string' || q.stem.length < 10) fail(where, 'stem missing or too short')
      if (!Array.isArray(q.options) || q.options.length < 4 || q.options.length > 5) {
        return fail(where, `expected 4 or 5 options, got ${q.options?.length}`)
      }
      if (q.options.some((o) => typeof o !== 'string' || !o.trim())) fail(where, 'empty option text')
      if (new Set(q.options).size !== q.options.length) fail(where, 'duplicate option text')
      if (!Array.isArray(q.correct) || q.correct.length === 0) return fail(where, 'missing correct answers')
      if (q.correct.some((c) => !Number.isInteger(c) || c < 0 || c >= q.options.length)) {
        fail(where, `correct index out of range: ${JSON.stringify(q.correct)}`)
      }
      if (new Set(q.correct).size !== q.correct.length) fail(where, 'duplicate correct indices')
      if (q.options.length === 4 && q.correct.length !== 1) fail(where, '4-option questions must have exactly 1 correct answer')
      if (q.options.length === 5 && q.correct.length !== 2) fail(where, '5-option questions must have exactly 2 correct answers')
      if (typeof q.explanation !== 'string' || q.explanation.length < 10) fail(where, 'explanation missing or too short')
      perChapter[q.chapter] = (perChapter[q.chapter] ?? 0) + 1
    })
  }

  const bankTotal = Object.values(perChapter).reduce((a, b) => a + b, 0)
  grandTotal += bankTotal
  for (const [chapter, needed] of Object.entries(exam.mock?.distribution ?? {})) {
    const have = perChapter[chapter] ?? 0
    if (have < needed) {
      fail(examPath, `mock needs ${needed} questions for chapter ${chapter} but bank has ${have}`)
    }
  }
  const distTotal = Object.values(exam.mock?.distribution ?? {}).reduce((a, b) => a + b, 0)
  if (distTotal !== exam.mock?.totalQuestions) {
    fail(examPath, `distribution sums to ${distTotal} but totalQuestions is ${exam.mock?.totalQuestions}`)
  }
  console.log(`${exam.id ?? dir}: ${bankTotal} questions ${JSON.stringify(perChapter)}`)
}

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) found:`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(`OK — ${grandTotal} questions across ${examDirs.length} exam(s), all checks passed.`)
